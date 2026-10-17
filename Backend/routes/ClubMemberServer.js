const express = require('express');
const clubMemberController = require('../controllers/ClubMemberController');
const requireAdmin = require('../middlewares/adminAuth');

const router = express.Router();

router.post('/', clubMemberController.submitClubMember);
router.get('/', requireAdmin, clubMemberController.getClubMembers);
router.get('/screening', requireAdmin, clubMemberController.getScreeningMembers);
router.delete('/screening/:id', requireAdmin, clubMemberController.deleteScreeningMember);
router.delete('/:id', requireAdmin, clubMemberController.deleteClubMember);
router.patch('/:id/role', requireAdmin, clubMemberController.updateMemberRole);
router.put('/:id', requireAdmin, clubMemberController.updateMemberRole);
router.patch('/:id/promote', requireAdmin, clubMemberController.promoteMember);
router.put('/:id/promote', requireAdmin, clubMemberController.promoteMember);
router.patch('/:id/resign', requireAdmin, clubMemberController.acceptResignation);
router.post('/:id/resign', requireAdmin, clubMemberController.acceptResignation);
router.patch('/:id/terminate', requireAdmin, clubMemberController.terminateMember);
router.post('/:id/terminate', requireAdmin, clubMemberController.terminateMember);

module.exports = router;
