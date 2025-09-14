const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { verifyProvider, issueCertificate, verifyCertificate } = require('../services/blockchainService');
const User = require('../models/User');
const Certificate = require('../models/Certificate');

const router = express.Router();

// @desc    Verify service provider on blockchain
// @route   POST /api/blockchain/verify-provider
// @access  Private (Admin only)
router.post('/verify-provider', protect, authorize('admin'), [
  body('providerId').isMongoId().withMessage('Valid provider ID is required'),
  body('verificationData').isObject().withMessage('Verification data is required'),
  body('certificateType').isIn(['business_license', 'tax_registration', 'insurance', 'quality_certification']).withMessage('Invalid certificate type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { providerId, verificationData, certificateType } = req.body;

    const provider = await User.findById(providerId);
    if (!provider || provider.role !== 'local_provider') {
      return res.status(404).json({
        status: 'error',
        message: 'Provider not found'
      });
    }

    // Verify provider on blockchain
    const verificationResult = await verifyProvider({
      providerId: provider._id,
      providerData: {
        name: `${provider.firstName} ${provider.lastName}`,
        businessName: provider.businessDetails.businessName,
        licenseNumber: provider.businessDetails.licenseNumber,
        address: provider.businessDetails.address
      },
      verificationData,
      certificateType
    });

    if (verificationResult.success) {
      // Update provider verification status
      provider.businessDetails.isVerified = true;
      provider.blockchainVerification.isVerified = true;
      provider.blockchainVerification.verificationDate = new Date();
      provider.blockchainVerification.smartContractAddress = verificationResult.contractAddress;
      
      await provider.save();

      // Create certificate record
      const certificate = new Certificate({
        provider: providerId,
        type: certificateType,
        blockchainHash: verificationResult.transactionHash,
        contractAddress: verificationResult.contractAddress,
        issuedBy: req.user._id,
        issuedAt: new Date(),
        status: 'active',
        verificationData: verificationData
      });

      await certificate.save();

      res.status(200).json({
        status: 'success',
        message: 'Provider verified successfully on blockchain',
        data: {
          verification: verificationResult,
          certificate: certificate
        }
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: 'Provider verification failed',
        data: { error: verificationResult.error }
      });
    }
  } catch (error) {
    console.error('Verify provider error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while verifying provider'
    });
  }
});

// @desc    Issue digital certificate
// @route   POST /api/blockchain/issue-certificate
// @access  Private (Admin only)
router.post('/issue-certificate', protect, authorize('admin'), [
  body('providerId').isMongoId().withMessage('Valid provider ID is required'),
  body('certificateType').isIn(['business_license', 'tax_registration', 'insurance', 'quality_certification']).withMessage('Invalid certificate type'),
  body('validityPeriod').isInt({ min: 1, max: 3650 }).withMessage('Validity period must be between 1 and 3650 days'),
  body('description').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { providerId, certificateType, validityPeriod, description } = req.body;

    const provider = await User.findById(providerId);
    if (!provider || provider.role !== 'local_provider') {
      return res.status(404).json({
        status: 'error',
        message: 'Provider not found'
      });
    }

    // Issue certificate on blockchain
    const certificateResult = await issueCertificate({
      providerId: provider._id,
      providerData: {
        name: `${provider.firstName} ${provider.lastName}`,
        businessName: provider.businessDetails.businessName,
        licenseNumber: provider.businessDetails.licenseNumber,
        address: provider.businessDetails.address
      },
      certificateType,
      validityPeriod,
      description
    });

    if (certificateResult.success) {
      // Create certificate record
      const certificate = new Certificate({
        provider: providerId,
        type: certificateType,
        blockchainHash: certificateResult.transactionHash,
        contractAddress: certificateResult.contractAddress,
        certificateId: certificateResult.certificateId,
        issuedBy: req.user._id,
        issuedAt: new Date(),
        validUntil: new Date(Date.now() + validityPeriod * 24 * 60 * 60 * 1000),
        status: 'active',
        description: description,
        metadata: certificateResult.metadata
      });

      await certificate.save();

      res.status(201).json({
        status: 'success',
        message: 'Certificate issued successfully',
        data: {
          certificate: certificate,
          blockchain: certificateResult
        }
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: 'Certificate issuance failed',
        data: { error: certificateResult.error }
      });
    }
  } catch (error) {
    console.error('Issue certificate error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while issuing certificate'
    });
  }
});

// @desc    Verify certificate
// @route   GET /api/blockchain/verify-certificate/:certificateId
// @access  Public
router.get('/verify-certificate/:certificateId', async (req, res) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findOne({
      $or: [
        { certificateId: certificateId },
        { blockchainHash: certificateId }
      ]
    }).populate('provider', 'firstName lastName businessDetails');

    if (!certificate) {
      return res.status(404).json({
        status: 'error',
        message: 'Certificate not found'
      });
    }

    // Verify certificate on blockchain
    const verificationResult = await verifyCertificate({
      certificateId: certificate.certificateId,
      contractAddress: certificate.contractAddress,
      blockchainHash: certificate.blockchainHash
    });

    res.status(200).json({
      status: 'success',
      data: {
        certificate: {
          id: certificate._id,
          certificateId: certificate.certificateId,
          type: certificate.type,
          provider: {
            name: `${certificate.provider.firstName} ${certificate.provider.lastName}`,
            businessName: certificate.provider.businessDetails.businessName
          },
          issuedAt: certificate.issuedAt,
          validUntil: certificate.validUntil,
          status: certificate.status,
          description: certificate.description
        },
        verification: verificationResult
      }
    });
  } catch (error) {
    console.error('Verify certificate error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while verifying certificate'
    });
  }
});

// @desc    Get provider certificates
// @route   GET /api/blockchain/provider/:providerId/certificates
// @access  Private
router.get('/provider/:providerId/certificates', protect, async (req, res) => {
  try {
    const { providerId } = req.params;

    // Check if user is the provider or admin
    if (req.user._id.toString() !== providerId && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view these certificates'
      });
    }

    const certificates = await Certificate.find({ provider: providerId })
      .populate('issuedBy', 'firstName lastName')
      .sort({ issuedAt: -1 });

    res.status(200).json({
      status: 'success',
      data: { certificates }
    });
  } catch (error) {
    console.error('Get provider certificates error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching certificates'
    });
  }
});

// @desc    Get all certificates
// @route   GET /api/blockchain/certificates
// @access  Private (Admin only)
router.get('/certificates', protect, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const certificates = await Certificate.find(filter)
      .populate('provider', 'firstName lastName businessDetails')
      .populate('issuedBy', 'firstName lastName')
      .sort({ issuedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Certificate.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: certificates.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: { certificates }
    });
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching certificates'
    });
  }
});

// @desc    Revoke certificate
// @route   PUT /api/blockchain/certificates/:certificateId/revoke
// @access  Private (Admin only)
router.put('/certificates/:certificateId/revoke', protect, authorize('admin'), [
  body('reason').notEmpty().withMessage('Revocation reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { certificateId } = req.params;
    const { reason } = req.body;

    const certificate = await Certificate.findById(certificateId);
    if (!certificate) {
      return res.status(404).json({
        status: 'error',
        message: 'Certificate not found'
      });
    }

    // Revoke certificate on blockchain
    const revocationResult = await revokeCertificate({
      certificateId: certificate.certificateId,
      contractAddress: certificate.contractAddress,
      reason: reason
    });

    if (revocationResult.success) {
      certificate.status = 'revoked';
      certificate.revokedAt = new Date();
      certificate.revokedBy = req.user._id;
      certificate.revocationReason = reason;
      certificate.revocationHash = revocationResult.transactionHash;
      
      await certificate.save();

      res.status(200).json({
        status: 'success',
        message: 'Certificate revoked successfully',
        data: { certificate }
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: 'Certificate revocation failed',
        data: { error: revocationResult.error }
      });
    }
  } catch (error) {
    console.error('Revoke certificate error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while revoking certificate'
    });
  }
});

// @desc    Get blockchain statistics
// @route   GET /api/blockchain/stats
// @access  Private (Admin only)
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const stats = await Certificate.aggregate([
      {
        $group: {
          _id: null,
          totalCertificates: { $sum: 1 },
          activeCertificates: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          revokedCertificates: {
            $sum: { $cond: [{ $eq: ['$status', 'revoked'] }, 1, 0] }
          },
          expiredCertificates: {
            $sum: { $cond: [{ $lt: ['$validUntil', new Date()] }, 1, 0] }
          }
        }
      }
    ]);

    const typeStats = await Certificate.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const monthlyStats = await Certificate.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$issuedAt' },
            month: { $month: '$issuedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        overview: stats[0] || {
          totalCertificates: 0,
          activeCertificates: 0,
          revokedCertificates: 0,
          expiredCertificates: 0
        },
        typeDistribution: typeStats,
        monthlyTrend: monthlyStats
      }
    });
  } catch (error) {
    console.error('Get blockchain stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching blockchain statistics'
    });
  }
});

// @desc    Get blockchain network status
// @route   GET /api/blockchain/network-status
// @access  Public
router.get('/network-status', async (req, res) => {
  try {
    const networkStatus = await getBlockchainNetworkStatus();
    
    res.status(200).json({
      status: 'success',
      data: { networkStatus }
    });
  } catch (error) {
    console.error('Get network status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching network status'
    });
  }
});

module.exports = router;

