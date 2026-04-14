const Contact = require('../models/Contact');

exports.submitContact = async (req, res) => {
  try {
    const { name, phoneOrEmail, message } = req.body;
    
    if (!name || !phoneOrEmail || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    
    await Contact.create({ name, phoneOrEmail, message });
    
    res.status(201).json({ success: true, message: 'Message sent successfully.' });
  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({ success: false, message: 'Server error while sending message. Please try again.' });
  }
};
