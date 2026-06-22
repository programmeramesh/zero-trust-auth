const User = require('../models/User');

class SessionService {
  constructor() {
    this.maxSessionsPerUser = 5; // Maximum concurrent sessions
    this.sessionTimeoutMinutes = 60; // Session timeout in minutes
  }

  /**
   * Create a new session for a user
   */
  async createSession(userId, token, refreshToken, device, ipAddress, userAgent) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Remove expired tokens and sessions
    this.removeExpiredSessions(user);
    this.removeExpiredRefreshTokens(user);

    // Check if max sessions reached
    if (user.sessions.length >= this.maxSessionsPerUser) {
      // Remove oldest session
      user.sessions.sort((a, b) => a.createdAt - b.createdAt);
      user.sessions.shift();
    }

    const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Add new session
    user.sessions.push({
      token,
      refreshToken,
      refreshTokenExpiresAt,
      device,
      ipAddress,
      userAgent,
      createdAt: new Date(),
      lastActivity: new Date(),
    });

    await user.save();
    return user.sessions;
  }

  /**
   * Find session by refresh token
   */
  async findSessionByRefreshToken(userId, refreshToken) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user.sessions.find((s) => s.refreshToken === refreshToken && !s.revoked && s.refreshTokenExpiresAt > new Date());
  }

  /**
   * Revoke a refresh token
   */
  async revokeRefreshToken(userId, refreshToken) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    let revoked = false;
    user.sessions = user.sessions.map((session) => {
      if (session.refreshToken === refreshToken) {
        session.revoked = true;
        revoked = true;
      }
      return session;
    });

    await user.save();
    return revoked;
  }

  /**
   * Remove expired refresh tokens from user sessions
   */
  removeExpiredRefreshTokens(user) {
    const now = new Date();
    user.sessions = user.sessions.map((session) => {
      if (session.refreshTokenExpiresAt && session.refreshTokenExpiresAt <= now) {
        return { ...session, revoked: true };
      }
      return session;
    });
  }

  /**
   * Remove a specific session
   */
  async removeSession(userId, token) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.sessions = user.sessions.filter(s => s.token !== token);
    await user.save();
    return user.sessions;
  }

  /**
   * Update session activity timestamp
   */
  async updateSessionActivity(userId, token) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const session = user.sessions.find(s => s.token === token);
    if (session) {
      session.lastActivity = new Date();
      await user.save();
    }

    return session;
  }

  /**
   * Remove all sessions except current
   */
  async removeAllOtherSessions(userId, currentToken) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.sessions = user.sessions.filter(s => s.token === currentToken);
    await user.save();
    return user.sessions;
  }

  /**
   * Remove all sessions for a user
   */
  async removeAllSessions(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.sessions = [];
    await user.save();
    return [];
  }

  /**
   * Remove expired sessions
   */
  removeExpiredSessions(user) {
    const now = new Date();
    const timeoutThreshold = new Date(now.getTime() - this.sessionTimeoutMinutes * 60 * 1000);
    
    user.sessions = user.sessions.filter(session => 
      session.lastActivity > timeoutThreshold
    );
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Remove expired sessions first
    this.removeExpiredSessions(user);
    this.removeExpiredRefreshTokens(user);
    await user.save();

    return user.sessions.filter((session) => !session.revoked);
  }

  /**
   * Checks if a session with the access token is still valid
   */
  async isSessionValid(userId, token) {
    const user = await User.findById(userId);
    if (!user) {
      return false;
    }

    const session = user.sessions.find(s => s.token === token && !s.revoked);
    if (!session) {
      return false;
    }

    // Check if session has expired
    const now = new Date();
    const timeoutThreshold = new Date(now.getTime() - this.sessionTimeoutMinutes * 60 * 1000);
    
    return session.lastActivity > timeoutThreshold;
  }
}

module.exports = new SessionService();
