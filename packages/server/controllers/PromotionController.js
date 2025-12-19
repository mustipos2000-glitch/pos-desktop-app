const Promotion = require('../models/Promotion');

class PromotionController {
  static getAllPromotions(req, res) {
    try {
      const promotions = Promotion.getAll();
      res.json({ success: true, data: promotions });
    } catch (error) {
      console.error('Error fetching promotions:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static getPromotionById(req, res) {
    try {
      const { id } = req.params;
      const promotion = Promotion.getById(id);
      
      if (!promotion) {
        return res.status(404).json({ success: false, error: 'Promotion not found' });
      }
      
      res.json({ success: true, data: promotion });
    } catch (error) {
      console.error('Error fetching promotion:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static getActivePromotionByProductId(req, res) {
    try {
      const { productId } = req.params;
      const promotion = Promotion.getActiveByProductId(productId);
      res.json({ success: true, data: promotion });
    } catch (error) {
      console.error('Error fetching active promotion:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static createPromotion(req, res) {
    try {
      const promotion = Promotion.create(req.body);
      res.status(201).json({ success: true, data: promotion });
    } catch (error) {
      console.error('Error creating promotion:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static updatePromotion(req, res) {
    try {
      const { id } = req.params;
      const promotion = Promotion.update(id, req.body);
      res.json({ success: true, data: promotion });
    } catch (error) {
      console.error('Error updating promotion:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static deletePromotion(req, res) {
    try {
      const { id } = req.params;
      Promotion.delete(id);
      res.json({ success: true, message: 'Promotion deleted successfully' });
    } catch (error) {
      console.error('Error deleting promotion:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = PromotionController;
