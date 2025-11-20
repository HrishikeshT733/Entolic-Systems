

const express=require('express');
const Template=require('../models/template');
const{ authMiddleware }=require('../middleware/auth');
const router=express.Router();

// Helper function to extract image type from Base64 string
const getImageTypeFromBase64 = (base64String) => {
  if (!base64String) return null;
  
  const matches = base64String.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
  return matches ? matches[1] : null;
};

// Helper function to validate Base64 image (50MB limit)
const validateBase64Image = (base64String) => {
  if (!base64String) return { isValid: false, error: 'Image data is required' };
  
  const imageType = getImageTypeFromBase64(base64String);
  if (!imageType) {
    return { 
      isValid: false, 
      error: 'Invalid Base64 image format. Must start with data:image/...;base64,' 
    };
  }
  
  if (!imageType.startsWith('image/')) {
    return { 
      isValid: false, 
      error: 'Invalid image type. Only image files are supported' 
    };
  }
  
  // Check file size (rough estimate - Base64 is about 33% larger than binary)
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
  const fileSizeInBytes = (base64Data.length * 3) / 4;
  const maxSizeInBytes = 50 * 1024 * 1024; // 50MB limit
  
  if (fileSizeInBytes > maxSizeInBytes) {
    return { 
      isValid: false, 
      error: 'Image size too large. Maximum size is 50MB' 
    };
  }
  
  return { isValid: true, imageType };
};

// 5.1 Get All Templates
router.get('/templates', authMiddleware, async (req, res) => {
  try {
    const { search, verified } = req.query;
    const userId = req.user._id;

    // Build query filter
    const filter = { userId };
    
    // Add search filter if provided
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    // Add verified filter if provided
    if (verified !== undefined) {
      filter.verified = verified === 'true';
    }

    // Find templates for the authenticated user
    const templates = await Template.find(filter)
      .sort({ updatedAt: -1 })
      .select('_id name content image verified createdAt updatedAt');

    res.json({
      success: true,
      data: {
        templates: templates.map(template => ({
          templateId: template._id,
          name: template.name,
          content: template.content,
          image: template.image,
          hasImage: !!template.image,
          verified: template.verified,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt
        }))
      }
    });

  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// 5.2 Create Template
router.post('/templates', authMiddleware, async (req, res) => {
  try {
    const { name, content, image } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Template name is required'
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Template content is required'
      });
    }

    // Validate image if provided
    if (image) {
      const validation = validateBase64Image(image);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.error
        });
      }
    }

    // Check if template with same name already exists for this user
    const existingTemplate = await Template.findOne({
      userId,
      name: name.trim()
    });

    if (existingTemplate) {
      return res.status(400).json({
        success: false,
        message: 'Template with this name already exists'
      });
    }

    // Create new template
    const template = new Template({
      userId,
      name: name.trim(),
      content: content.trim(),
      image: image || null,
      verified: false
    });

    await template.save();

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: {
        templateId: template._id,
        name: template.name,
        content: template.content,
        image: template.image,
        hasImage: !!template.image,
        verified: template.verified
      }
    });

  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// 5.3 Update Template
router.put('/templates/:templateId', authMiddleware, async (req, res) => {
  try {
    const { templateId } = req.params;
    const { name, content, image } = req.body;
    const userId = req.user._id;

    // Validate templateId
    if (!templateId) {
      return res.status(400).json({
        success: false,
        message: 'Template ID is required'
      });
    }

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Template name is required'
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Template content is required'
      });
    }

    // Validate image if provided
    if (image) {
      const validation = validateBase64Image(image);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.error
        });
      }
    }

    // Find template and ensure it belongs to the authenticated user
    const template = await Template.findOne({
      _id: templateId,
      userId
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Check if another template with the same name already exists (excluding current template)
    const existingTemplate = await Template.findOne({
      userId,
      name: name.trim(),
      _id: { $ne: templateId }
    });

    if (existingTemplate) {
      return res.status(400).json({
        success: false,
        message: 'Another template with this name already exists'
      });
    }

    // Update template
    template.name = name.trim();
    template.content = content.trim();
    
    // Update image if provided, otherwise keep existing
    if (image !== undefined) {
      template.image = image;
    }
    
    template.verified = false;
    await template.save();

    res.json({
      success: true,
      message: 'Template updated successfully',
      data: {
        templateId: template._id,
        name: template.name,
        content: template.content,
        image: template.image,
        hasImage: !!template.image,
        verified: template.verified
      }
    });

  } catch (error) {
    console.error('Update template error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid template ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// 5.4 Delete Template
router.delete('/templates/:templateId', authMiddleware, async (req, res) => {
  try {
    const { templateId } = req.params;
    const userId = req.user._id;

    // Validate templateId
    if (!templateId) {
      return res.status(400).json({
        success: false,
        message: 'Template ID is required'
      });
    }

    // Find template and ensure it belongs to the authenticated user
    const template = await Template.findOne({
      _id: templateId,
      userId
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Delete template
    await Template.findByIdAndDelete(templateId);

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });

  } catch (error) {
    console.error('Delete template error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid template ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;