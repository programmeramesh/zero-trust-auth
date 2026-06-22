const router = require('express').Router();
const ipPolicyService = require('../services/ipPolicyService');
const authMiddleware = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');

// Add IP to whitelist (Admin only)
router.post('/whitelist', authMiddleware, rbacMiddleware(['Admin']), async (req, res) => {
  try {
    const { ipAddress, description } = req.body;
    const policy = await ipPolicyService.addToWhitelist(ipAddress, description, req.user.id);
    res.json({ message: 'IP added to whitelist', policy });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Add IP to blacklist (Admin only)
router.post('/blacklist', authMiddleware, rbacMiddleware(['Admin']), async (req, res) => {
  try {
    const { ipAddress, description } = req.body;
    const policy = await ipPolicyService.addToBlacklist(ipAddress, description, req.user.id);
    res.json({ message: 'IP added to blacklist', policy });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Remove IP from policy (Admin only)
router.delete('/:ipAddress', authMiddleware, rbacMiddleware(['Admin']), async (req, res) => {
  try {
    const { ipAddress } = req.params;
    const result = await ipPolicyService.removeIP(ipAddress);
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// Toggle IP policy (Admin only)
router.patch('/:ipAddress/toggle', authMiddleware, rbacMiddleware(['Admin']), async (req, res) => {
  try {
    const { ipAddress } = req.params;
    const policy = await ipPolicyService.togglePolicy(ipAddress);
    res.json({ message: 'Policy toggled', policy });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// Get all IP policies (Admin only)
router.get('/', authMiddleware, rbacMiddleware(['Admin']), async (req, res) => {
  try {
    const policies = await ipPolicyService.getAllPolicies();
    res.json({ policies });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get whitelist (Admin only)
router.get('/whitelist', authMiddleware, rbacMiddleware(['Admin']), async (req, res) => {
  try {
    const whitelist = await ipPolicyService.getWhitelist();
    res.json({ whitelist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get blacklist (Admin only)
router.get('/blacklist', authMiddleware, rbacMiddleware(['Admin']), async (req, res) => {
  try {
    const blacklist = await ipPolicyService.getBlacklist();
    res.json({ blacklist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
