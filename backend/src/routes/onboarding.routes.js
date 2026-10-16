import express from 'express';
import { query } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Check if domain slug is available
router.get('/check-slug/:slug', async (req, res) => {
  try {
    const rawSlug = req.params.slug.toLowerCase().trim();
    const cleanSlug = rawSlug.replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');

    if (!cleanSlug) {
      return res.status(400).json({ available: false, error: 'Invalid slug' });
    }

    const check = await query(`SELECT id FROM booking_pages WHERE slug = $1`, [cleanSlug]);
    const available = check.rowCount === 0;

    return res.json({
      slug: cleanSlug,
      available,
      message: available ? 'Slug is available!' : 'Slug is already taken',
    });
  } catch (err) {
    console.error('Error checking slug:', err);
    return res.status(500).json({ error: 'Failed to check slug' });
  }
});

// Update or complete "Create Page" onboarding
router.post('/create-page', authenticateToken, async (req, res) => {
  try {
    const { page_name, slug, description, theme, logo_url, timezone = 'Asia/Calcutta' } = req.body;

    if (!page_name || !slug) {
      return res.status(400).json({ error: 'Page name and slug are required' });
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');

    // Check if slug taken by someone else
    const slugCheck = await query(
      `SELECT id FROM booking_pages WHERE slug = $1 AND doctor_profile_id != $2`,
      [cleanSlug, req.user.doctorProfileId]
    );

    if (slugCheck.rowCount > 0) {
      return res.status(409).json({ error: 'This domain/slug is already taken. Please choose another.' });
    }

    const updateRes = await query(
      `UPDATE booking_pages 
       SET page_name = $1, 
           slug = $2, 
           description = $3, 
           theme = $4, 
           logo_url = COALESCE($5, logo_url), 
           timezone = $6,
           is_live = true,
           updated_at = CURRENT_TIMESTAMP
       WHERE doctor_profile_id = $7
       RETURNING *`,
      [
        page_name,
        cleanSlug,
        description || 'Welcome to my scheduling page, please select an option below to book an appointment',
        theme || 'Modern Minimal',
        logo_url || null,
        timezone,
        req.user.doctorProfileId,
      ]
    );

    if (updateRes.rowCount === 0) {
      return res.status(404).json({ error: 'Booking page not found for this doctor' });
    }

    return res.json({
      success: true,
      message: 'Booking page created and saved successfully',
      bookingPage: updateRes.rows[0],
    });
  } catch (err) {
    console.error('Error updating create page:', err);
    return res.status(500).json({ error: 'Failed to save booking page. ' + err.message });
  }
});

// Get current doctor's page details
router.get('/page-details', authenticateToken, async (req, res) => {
  try {
    const pageRes = await query(
      `SELECT * FROM booking_pages WHERE doctor_profile_id = $1 LIMIT 1`,
      [req.user.doctorProfileId]
    );

    if (pageRes.rowCount === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }

    return res.json({
      bookingPage: pageRes.rows[0],
    });
  } catch (err) {
    console.error('Error fetching page details:', err);
    return res.status(500).json({ error: 'Failed to fetch page details' });
  }
});

export default router;
