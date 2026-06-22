const IPPolicy = require('../models/IPPolicy');

class IPPolicyService {
  /**
   * Add IP to whitelist
   */
  async addToWhitelist(ipAddress, description, userId) {
    const existing = await IPPolicy.findOne({ ipAddress });
    if (existing) {
      if (existing.type === 'whitelist') {
        throw new Error('IP already in whitelist');
      }
      // Update existing policy
      existing.type = 'whitelist';
      existing.description = description;
      existing.isActive = true;
      await existing.save();
      return existing;
    }

    const ipPolicy = new IPPolicy({
      ipAddress,
      type: 'whitelist',
      description,
      createdBy: userId,
    });
    await ipPolicy.save();
    return ipPolicy;
  }

  /**
   * Add IP to blacklist
   */
  async addToBlacklist(ipAddress, description, userId) {
    const existing = await IPPolicy.findOne({ ipAddress });
    if (existing) {
      if (existing.type === 'blacklist') {
        throw new Error('IP already in blacklist');
      }
      // Update existing policy
      existing.type = 'blacklist';
      existing.description = description;
      existing.isActive = true;
      await existing.save();
      return existing;
    }

    const ipPolicy = new IPPolicy({
      ipAddress,
      type: 'blacklist',
      description,
      createdBy: userId,
    });
    await ipPolicy.save();
    return ipPolicy;
  }

  /**
   * Remove IP from whitelist/blacklist
   */
  async removeIP(ipAddress) {
    const result = await IPPolicy.deleteOne({ ipAddress });
    if (result.deletedCount === 0) {
      throw new Error('IP policy not found');
    }
    return { message: 'IP policy removed successfully' };
  }

  /**
   * Check if IP is whitelisted
   */
  async isWhitelisted(ipAddress) {
    const policy = await IPPolicy.findOne({ 
      ipAddress, 
      type: 'whitelist', 
      isActive: true 
    });
    return !!policy;
  }

  /**
   * Check if IP is blacklisted
   */
  async isBlacklisted(ipAddress) {
    const policy = await IPPolicy.findOne({ 
      ipAddress, 
      type: 'blacklist', 
      isActive: true 
    });
    return !!policy;
  }

  /**
   * Check if IP is allowed (not blacklisted and optionally whitelisted)
   */
  async isIPAllowed(ipAddress, requireWhitelist = false) {
    const isBlacklisted = await this.isBlacklisted(ipAddress);
    if (isBlacklisted) {
      return false;
    }

    if (requireWhitelist) {
      return await this.isWhitelisted(ipAddress);
    }

    return true;
  }

  /**
   * Get all IP policies
   */
  async getAllPolicies() {
    return await IPPolicy.find({}).populate('createdBy', 'name email');
  }

  /**
   * Get whitelist
   */
  async getWhitelist() {
    return await IPPolicy.find({ type: 'whitelist', isActive: true });
  }

  /**
   * Get blacklist
   */
  async getBlacklist() {
    return await IPPolicy.find({ type: 'blacklist', isActive: true });
  }

  /**
   * Toggle IP policy active status
   */
  async togglePolicy(ipAddress) {
    const policy = await IPPolicy.findOne({ ipAddress });
    if (!policy) {
      throw new Error('IP policy not found');
    }
    policy.isActive = !policy.isActive;
    await policy.save();
    return policy;
  }
}

module.exports = new IPPolicyService();
