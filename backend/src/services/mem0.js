import fetch from 'node-fetch';

class Mem0Service {
  constructor() {
    this.apiKey = process.env.MEM0_API_KEY;
    this.baseUrl = 'https://api.mem0.ai/v1';
  }

  /**
   * Create a memory for a user
   * @param {string} userId - User ID
   * @param {string} content - Memory content
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Created memory
   */
  async createMemory(userId, content, metadata = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/memories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          content: content,
          metadata: {
            ...metadata,
            created_at: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Mem0 API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Memory created:', result.id);
      return result;
    } catch (error) {
      console.error('Mem0 create memory error:', error);
      throw new Error(`Failed to create memory: ${error.message}`);
    }
  }

  /**
   * Search memories for a user
   * @param {string} userId - User ID
   * @param {string} query - Search query
   * @param {number} limit - Number of results to return
   * @returns {Promise<Array>} Search results
   */
  async searchMemories(userId, query, limit = 10) {
    try {
      const response = await fetch(`${this.baseUrl}/memories/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          query: query,
          limit: limit
        })
      });

      if (!response.ok) {
        throw new Error(`Mem0 API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ Found ${result.results.length} memories for query: ${query}`);
      return result.results;
    } catch (error) {
      console.error('Mem0 search memories error:', error);
      throw new Error(`Failed to search memories: ${error.message}`);
    }
  }

  /**
   * Get all memories for a user
   * @param {string} userId - User ID
   * @param {number} limit - Number of results to return
   * @returns {Promise<Array>} User memories
   */
  async getUserMemories(userId, limit = 50) {
    try {
      const response = await fetch(`${this.baseUrl}/memories?user_id=${userId}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Mem0 API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ Retrieved ${result.results.length} memories for user: ${userId}`);
      return result.results;
    } catch (error) {
      console.error('Mem0 get user memories error:', error);
      throw new Error(`Failed to get user memories: ${error.message}`);
    }
  }

  /**
   * Update a memory
   * @param {string} memoryId - Memory ID
   * @param {string} content - New content
   * @param {Object} metadata - Updated metadata
   * @returns {Promise<Object>} Updated memory
   */
  async updateMemory(memoryId, content, metadata = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/memories/${memoryId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: content,
          metadata: {
            ...metadata,
            updated_at: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Mem0 API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Memory updated:', memoryId);
      return result;
    } catch (error) {
      console.error('Mem0 update memory error:', error);
      throw new Error(`Failed to update memory: ${error.message}`);
    }
  }

  /**
   * Delete a memory
   * @param {string} memoryId - Memory ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteMemory(memoryId) {
    try {
      const response = await fetch(`${this.baseUrl}/memories/${memoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Mem0 API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Memory deleted:', memoryId);
      return result;
    } catch (error) {
      console.error('Mem0 delete memory error:', error);
      throw new Error(`Failed to delete memory: ${error.message}`);
    }
  }

  /**
   * Store chat context for a user
   * @param {string} userId - User ID
   * @param {string} message - User message
   * @param {string} response - AI response
   * @param {Object} context - Additional context
   * @returns {Promise<Object>} Stored context
   */
  async storeChatContext(userId, message, response, context = {}) {
    try {
      const content = `User: ${message}\nAI: ${response}`;
      const metadata = {
        type: 'chat_context',
        user_message: message,
        ai_response: response,
        ...context
      };

      return await this.createMemory(userId, content, metadata);
    } catch (error) {
      console.error('Mem0 store chat context error:', error);
      throw new Error(`Failed to store chat context: ${error.message}`);
    }
  }

  /**
   * Store image reference for a user
   * @param {string} userId - User ID
   * @param {string} imageUrl - Image URL
   * @param {string} imageType - Type of image (reference, generated, refined)
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Stored image reference
   */
  async storeImageReference(userId, imageUrl, imageType, metadata = {}) {
    try {
      const content = `User uploaded ${imageType} image: ${imageUrl}`;
      const imageMetadata = {
        type: 'image_reference',
        image_type: imageType,
        image_url: imageUrl,
        ...metadata
      };

      return await this.createMemory(userId, content, imageMetadata);
    } catch (error) {
      console.error('Mem0 store image reference error:', error);
      throw new Error(`Failed to store image reference: ${error.message}`);
    }
  }

  /**
   * Get user's image history
   * @param {string} userId - User ID
   * @param {string} imageType - Type of images to retrieve
   * @returns {Promise<Array>} Image references
   */
  async getUserImageHistory(userId, imageType = null) {
    try {
      const query = imageType ? `image_type:${imageType}` : 'image_reference';
      return await this.searchMemories(userId, query, 20);
    } catch (error) {
      console.error('Mem0 get user image history error:', error);
      throw new Error(`Failed to get user image history: ${error.message}`);
    }
  }

  /**
   * Get user's chat history
   * @param {string} userId - User ID
   * @param {number} limit - Number of recent chats to return
   * @returns {Promise<Array>} Chat history
   */
  async getUserChatHistory(userId, limit = 10) {
    try {
      return await this.searchMemories(userId, 'chat_context', limit);
    } catch (error) {
      console.error('Mem0 get user chat history error:', error);
      throw new Error(`Failed to get user chat history: ${error.message}`);
    }
  }

  /**
   * Get context for AI generation
   * @param {string} userId - User ID
   * @param {string} prompt - Current prompt
   * @returns {Promise<Object>} Context for AI
   */
  async getGenerationContext(userId, prompt) {
    try {
      // Get recent chat history
      const chatHistory = await this.getUserChatHistory(userId, 5);
      
      // Get recent image references
      const imageHistory = await this.getUserImageHistory(userId);
      
      // Get relevant memories based on prompt
      const relevantMemories = await this.searchMemories(userId, prompt, 5);

      return {
        chatHistory: chatHistory.map(m => ({
          content: m.content,
          metadata: m.metadata,
          created_at: m.created_at
        })),
        imageHistory: imageHistory.map(m => ({
          image_url: m.metadata.image_url,
          image_type: m.metadata.image_type,
          created_at: m.created_at
        })),
        relevantMemories: relevantMemories.map(m => ({
          content: m.content,
          metadata: m.metadata,
          created_at: m.created_at
        }))
      };
    } catch (error) {
      console.error('Mem0 get generation context error:', error);
      throw new Error(`Failed to get generation context: ${error.message}`);
    }
  }
}

export default new Mem0Service();
