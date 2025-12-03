const Member = require('../models/Member');

const MemberController = {
  getAllMembers: (req, res) => {
    try {
      const members = Member.getAll();
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getMemberById: (req, res) => {
    try {
      const member = Member.getById(req.params.id);
      if (!member) {
        return res.status(404).json({ error: 'Member not found' });
      }
      res.json(member);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  searchMembers: (req, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.json([]);
      }
      const members = Member.search(q);
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  createMember: (req, res) => {
    try {
      const { name, first_name, phone, email, address } = req.body;
      
      if (!name || !first_name) {
        return res.status(400).json({ error: 'Name and first name are required' });
      }

      const newMember = Member.create(name, first_name, phone, email, address);
      res.status(201).json(newMember);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  updateMember: (req, res) => {
    try {
      const { name, first_name, phone, email, address } = req.body;
      
      const updatedMember = Member.update(
        req.params.id, 
        name, 
        first_name, 
        phone, 
        email, 
        address
      );

      if (!updatedMember) {
        return res.status(404).json({ error: 'Member not found' });
      }

      res.json(updatedMember);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  deleteMember: (req, res) => {
    try {
      const result = Member.delete(req.params.id);
      
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Member not found' });
      }

      res.json({ message: 'Member deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = MemberController;
