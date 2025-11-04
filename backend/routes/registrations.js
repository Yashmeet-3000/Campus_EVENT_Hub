// Import required modules
const express = require('express');
const mongoose = require('mongoose');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { validateRegistration } = require('../middleware/validation');

// Create router instance
const router = express.Router();

/**
 * @route   POST /api/registrations
 * @desc    Register for an event (individual or team)
 * @access  Private
 */
router.post('/', authenticateToken, validateRegistration, async (req, res) => {
  try {
    const { event_id, form_answers, team_members, team_members_info, team_name } = req.body;
    const userId = req.user.userId;
    
    // Validate event exists
    const event = await Event.findById(event_id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check if event is published
    if (event.event_status !== 'published' && event.event_status !== 'ongoing') {
      return res.status(400).json({
        success: false,
        message: 'Registration is not open for this event'
      });
    }
    
    // Check if registration is open
    if (!event.registration_open) {
      return res.status(400).json({
        success: false,
        message: 'Registration is currently closed'
      });
    }
    
    // Check registration deadline
    const now = new Date();
    if (now < event.registration_start_datetime) {
      return res.status(400).json({
        success: false,
        message: 'Registration has not started yet'
      });
    }
    
    if (now > event.registration_end_datetime) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed'
      });
    }
    
    // Check if user is already registered
    const existingRegistration = await Registration.findOne({
      event_id,
      leader_user_id: userId
    });
    
    if (existingRegistration) {
      return res.status(409).json({
        success: false,
        message: 'You are already registered for this event'
      });
    }
    
    // Check capacity if max_teams is set
    if (event.max_teams) {
      const registrationCount = await Registration.countDocuments({
        event_id,
        status: { $in: ['pending', 'confirmed'] }
      });
      
      if (registrationCount >= event.max_teams) {
        return res.status(400).json({
          success: false,
          message: 'Event has reached maximum capacity'
        });
      }
    }
    
    // Build registration data
    const registrationData = {
      event_id,
      mode: event.registration_mode,
      leader_user_id: userId,
      status: 'pending'
    };
    
    // Handle team registration
    if (event.registration_mode === 'team') {
      if (!team_name || team_name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Team name is required for team events'
        });
      }
      
      registrationData.team_name = team_name;
      
      // Build members array
      const members = [
        {
          user_id: userId,
          role: 'leader',
          invite_status: 'auto_added'
        }
      ];
      
      // Add team members if provided (by user IDs)
      if (team_members && Array.isArray(team_members)) {
        // Verify all team members exist
        for (const memberId of team_members) {
          const memberUser = await User.findById(memberId);
          
          if (!memberUser) {
            return res.status(404).json({
              success: false,
              message: `User with ID ${memberId} not found`
            });
          }
          
          // Check if member is already leader
          if (memberId === userId) {
            continue; // Skip leader
          }
          
          members.push({
            user_id: memberId,
            role: 'member',
            invite_status: 'invited'
          });
        }
      }
      
      // Add team members if provided (by email/name - for frontend compatibility)
      if (team_members_info && Array.isArray(team_members_info)) {
        for (const memberInfo of team_members_info) {
          // Try to find user by email
          const memberUser = await User.findOne({ email: memberInfo.email });
          
          if (memberUser) {
            // User exists - add with user_id
            if (memberUser._id.toString() !== userId) {
              members.push({
                user_id: memberUser._id,
                role: 'member',
                invite_status: 'invited'
              });
            }
          } else {
            // User doesn't exist - store email/name for future invitation
            members.push({
              email: memberInfo.email,
              name: memberInfo.name,
              role: 'member',
              invite_status: 'pending_registration'
            });
          }
        }
      }
      
      // Validate team size
      if (members.length < event.min_team_size) {
        return res.status(400).json({
          success: false,
          message: `Team must have at least ${event.min_team_size} members`
        });
      }
      
      if (members.length > event.max_team_size) {
        return res.status(400).json({
          success: false,
          message: `Team cannot have more than ${event.max_team_size} members`
        });
      }
      
      registrationData.members = members;
    }
    
    // Process form answers if provided
    if (form_answers && Array.isArray(form_answers)) {
      const answers = [];
      
      for (const answer of form_answers) {
        const field = event.form_fields.find(f => f.field_id === answer.field_id);
        
        if (!field) {
          continue; // Skip invalid field IDs
        }
        
        const answerData = {
          field_id: answer.field_id,
          field_label: field.label
        };
        
        // Store value based on field type
        if (field.field_type === 'number') {
          answerData.value_number = answer.value;
        } else if (field.field_type === 'date') {
          answerData.value_date = answer.value;
        } else {
          answerData.value_text = answer.value;
        }
        
        answers.push(answerData);
      }
      
      registrationData.answers = answers;
    }
    
    // Create registration
    const registration = await Registration.create(registrationData);
    
    // Populate references
    await registration.populate('event_id', 'title event_type start_datetime venue');
    await registration.populate('leader_user_id', 'name email');
    await registration.populate('members.user_id', 'name email');
    
    console.log(`Registration created for event ${event.title} by ${userId}`);
    
    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      registration
    });
    
  } catch (error) {
    console.error('Registration error:', error.message);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

/**
 * @route   GET /api/registrations
 * @desc    Get registrations (filtered by event or user)
 * @access  Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { event_id, status, skip = 0, limit = 20 } = req.query;
    const userId = req.user.userId;
    
    // Build filter
    const filter = {};
    
    if (event_id) {
      // Validate ObjectId
      if (!mongoose.isValidObjectId(event_id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid event ID'
        });
      }
      
      filter.event_id = event_id;
      
      // Check if user is organizer of the event
      const event = await Event.findById(event_id);
      
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }
      
      // If not organizer or admin, only show user's own registration
      if (event.organizer_id.toString() !== userId && req.user.role !== 'admin') {
        filter.$or = [
          { leader_user_id: userId },
          { 'members.user_id': userId, 'members.invite_status': { $in: ['accepted', 'auto_added'] } }
        ];
      }
    } else {
      // If no event_id, show registrations where user is leader OR accepted member
      filter.$or = [
        { leader_user_id: userId },
        { 'members.user_id': userId, 'members.invite_status': { $in: ['accepted', 'auto_added'] } }
      ];
    }
    
    if (status) {
      filter.status = status;
    }
    
    // Get total count
    const totalCount = await Registration.countDocuments(filter);
    
    // Fetch registrations
    const registrations = await Registration.find(filter)
      .populate('event_id', 'title event_type start_datetime venue poster_url')
      .populate('leader_user_id', 'name email phone')
      .populate('members.user_id', 'name email')
      .sort({ created_at: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));
    
    return res.status(200).json({
      success: true,
      count: registrations.length,
      total: totalCount,
      registrations
    });
    
  } catch (error) {
    console.error('Get registrations error:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching registrations'
    });
  }
});

/**
 * @route   GET /api/registrations/invitations/pending
 * @desc    Get pending team invitations for current user
 * @access  Private
 */
router.get('/invitations/pending', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Find all registrations where user is a team member with 'invited' status
    const registrations = await Registration.find({
      'members': {
        $elemMatch: {
          user_id: userId,
          invite_status: 'invited'
        }
      }
    })
    .populate('event_id', 'title event_type start_datetime venue poster_url')
    .populate('leader_user_id', 'name email')
    .populate('members.user_id', 'name email')
    .sort({ created_at: -1 });
    
    return res.status(200).json({
      success: true,
      invitations: registrations
    });
    
  } catch (error) {
    console.error('Get pending invitations error:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching invitations'
    });
  }
});

/**
 * @route   PUT /api/registrations/:registrationId/invitation
 * @desc    Accept or decline team invitation
 * @access  Private
 */
router.put('/:registrationId/invitation', authenticateToken, async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { action } = req.body; // 'accept' or 'decline'
    const userId = req.user.userId;
    
    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "accept" or "decline"'
      });
    }
    
    // Find registration
    const registration = await Registration.findById(registrationId);
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }
    
    // Find member in registration
    const memberIndex = registration.members.findIndex(
      m => m.user_id && m.user_id.toString() === userId
    );
    
    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'You are not invited to this team'
      });
    }
    
    const member = registration.members[memberIndex];
    
    if (member.invite_status !== 'invited') {
      return res.status(400).json({
        success: false,
        message: `Invitation already ${member.invite_status}`
      });
    }
    
    // Update invite status
    registration.members[memberIndex].invite_status = action === 'accept' ? 'accepted' : 'declined';
    await registration.save();
    
    // Populate for response
    await registration.populate('event_id', 'title event_type start_datetime venue');
    await registration.populate('leader_user_id', 'name email');
    await registration.populate('members.user_id', 'name email');
    
    return res.status(200).json({
      success: true,
      message: `Invitation ${action}ed successfully`,
      registration
    });
    
  } catch (error) {
    console.error('Update invitation error:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Server error while updating invitation'
    });
  }
});

/**
 * @route   POST /api/registrations/:registrationId/members
 * @desc    Add team members to existing registration (team leader only)
 * @access  Private
 */
router.post('/:registrationId/members', authenticateToken, async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { members_to_add } = req.body; // Array of {_id, name, email}
    const userId = req.user.userId;
    
    if (!members_to_add || !Array.isArray(members_to_add) || members_to_add.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'members_to_add array is required'
      });
    }
    
    // Find registration
    const registration = await Registration.findById(registrationId);
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }
    
    // Check if user is team leader
    if (registration.leader_user_id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only team leader can add members'
      });
    }
    
    // Get event to check team size limits
    const event = await Event.findById(registration.event_id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Add new members
    for (const memberInfo of members_to_add) {
      // Check if already in team
      const alreadyExists = registration.members.some(
        m => m.user_id && m.user_id.toString() === memberInfo._id
      );
      
      if (alreadyExists) {
        continue; // Skip if already in team
      }
      
      // Find user
      const user = await User.findById(memberInfo._id);
      
      if (user) {
        registration.members.push({
          user_id: user._id,
          role: 'member',
          invite_status: 'invited'
        });
      }
    }
    
    // Validate team size
    if (registration.members.length > event.max_team_size) {
      return res.status(400).json({
        success: false,
        message: `Team size cannot exceed ${event.max_team_size} members`
      });
    }
    
    await registration.save();
    
    // Populate for response
    await registration.populate('event_id', 'title event_type start_datetime venue');
    await registration.populate('leader_user_id', 'name email');
    await registration.populate('members.user_id', 'name email');
    
    return res.status(200).json({
      success: true,
      message: 'Team members added successfully',
      registration
    });
    
  } catch (error) {
    console.error('Add team members error:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Server error while adding team members'
    });
  }
});

/**
 * @route   DELETE /api/registrations/:registrationId/members/:memberId
 * @desc    Remove team member from registration (team leader only)
 * @access  Private
 */
router.delete('/:registrationId/members/:memberId', authenticateToken, async (req, res) => {
  try {
    const { registrationId, memberId } = req.params;
    const userId = req.user.userId;
    
    // Find registration
    const registration = await Registration.findById(registrationId);
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }
    
    // Check if user is team leader
    if (registration.leader_user_id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only team leader can remove members'
      });
    }
    
    // Find member index
    const memberIndex = registration.members.findIndex(
      m => m.user_id && m.user_id.toString() === memberId
    );
    
    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in team'
      });
    }
    
    // Cannot remove leader
    if (registration.members[memberIndex].role === 'leader') {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove team leader'
      });
    }
    
    // Get event to check minimum team size
    const event = await Event.findById(registration.event_id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check if removing would violate minimum team size
    // Only validate if the member being removed is accepted or leader
    const memberToRemove = registration.members[memberIndex];
    
    if (memberToRemove.invite_status === 'accepted' || memberToRemove.invite_status === 'auto_added') {
      // Count current accepted members
      const acceptedMembers = registration.members.filter(
        m => m.invite_status === 'accepted' || m.invite_status === 'auto_added'
      );
      
      // Check if removing this member would drop below minimum
      if (acceptedMembers.length <= event.min_team_size) {
        return res.status(400).json({
          success: false,
          message: `Cannot remove accepted member. Team must have at least ${event.min_team_size} accepted members`
        });
      }
    }
    
    // Declined and invited members can always be removed without validation
    
    // Remove member
    registration.members.splice(memberIndex, 1);
    await registration.save();
    
    // Populate for response
    await registration.populate('event_id', 'title event_type start_datetime venue');
    await registration.populate('leader_user_id', 'name email');
    await registration.populate('members.user_id', 'name email');
    
    return res.status(200).json({
      success: true,
      message: 'Team member removed successfully',
      registration
    });
    
  } catch (error) {
    console.error('Remove team member error:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Server error while removing team member'
    });
  }
});

/**
 * @route   GET /api/registrations/:registrationId
 * @desc    Get single registration by ID
 * @access  Private
 */
router.get('/:registrationId', authenticateToken, async (req, res) => {
  try {
    const { registrationId } = req.params;
    const userId = req.user.userId;
    
    // Validate ObjectId
    if (!mongoose.isValidObjectId(registrationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid registration ID'
      });
    }
    
    // Find registration
    const registration = await Registration.findById(registrationId)
      .populate('event_id', 'title description event_type start_datetime end_datetime venue poster_url form_fields')
      .populate('leader_user_id', 'name email phone')
      .populate('members.user_id', 'name email phone');
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }
    
    // Check authorization
    const event = await Event.findById(registration.event_id);
    const isOrganizer = event && event.organizer_id.toString() === userId;
    const isLeader = registration.leader_user_id._id.toString() === userId;
    const isMember = registration.members.some(m => m.user_id._id.toString() === userId);
    const isAdmin = req.user.role === 'admin';
    
    if (!isOrganizer && !isLeader && !isMember && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this registration'
      });
    }
    
    return res.status(200).json({
      success: true,
      registration
    });
    
  } catch (error) {
    console.error('Get registration error:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching registration'
    });
  }
});

/**
 * @route   PUT /api/registrations/:registrationId/members/:memberId
 * @desc    Update team member invite status (accept/decline)
 * @access  Private
 */
router.put('/:registrationId/members/:memberId', authenticateToken, async (req, res) => {
  try {
    const { registrationId, memberId } = req.params;
    const { invite_status } = req.body;
    const userId = req.user.userId;
    
    // Validate ObjectIds
    if (!mongoose.isValidObjectId(registrationId) || !mongoose.isValidObjectId(memberId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid registration or member ID'
      });
    }
    
    // Validate invite_status
    if (!['accepted', 'declined'].includes(invite_status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invite status. Must be "accepted" or "declined"'
      });
    }
    
    // Find registration
    const registration = await Registration.findById(registrationId);
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }
    
    // Find member in registration
    const member = registration.members.find(m => m.user_id.toString() === memberId);
    
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in this registration'
      });
    }
    
    // Check authorization (user must be the member)
    if (userId !== memberId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own invite status'
      });
    }
    
    // Update invite status
    member.invite_status = invite_status;
    member.responded_at = new Date();
    
    // Check if all members have accepted and team size is valid
    const event = await Event.findById(registration.event_id);
    const acceptedMembers = registration.members.filter(m => 
      m.invite_status === 'accepted' || m.invite_status === 'auto_added'
    );
    
    if (acceptedMembers.length >= event.min_team_size && 
        acceptedMembers.length <= event.max_team_size) {
      registration.status = 'confirmed';
    }
    
    await registration.save();
    
    console.log(`Member ${memberId} ${invite_status} invitation for registration ${registrationId}`);
    
    return res.status(200).json({
      success: true,
      message: `Invitation ${invite_status}`,
      registration
    });
    
  } catch (error) {
    console.error('Update member status error:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Server error while updating member status'
    });
  }
});

/**
 * @route   DELETE /api/registrations/:registrationId
 * @desc    Cancel registration
 * @access  Private
 */
router.delete('/:registrationId', authenticateToken, async (req, res) => {
  try {
    const { registrationId } = req.params;
    const userId = req.user.userId;
    
    // Validate ObjectId
    if (!mongoose.isValidObjectId(registrationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid registration ID'
      });
    }
    
    // Find registration
    const registration = await Registration.findById(registrationId);
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }
    
    // Check authorization (leader or member or admin)
    const isLeader = registration.leader_user_id.toString() === userId;
    const isMember = registration.members.some(m => m.user_id.toString() === userId);
    const isAdmin = req.user.role === 'admin';
    
    if (!isLeader && !isMember && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this registration'
      });
    }
    
    // Soft delete by setting status to cancelled
    registration.status = 'cancelled';
    await registration.save();
    
    console.log(`Registration ${registrationId} cancelled by ${userId}`);
    
    return res.status(200).json({
      success: true,
      message: 'Registration cancelled successfully'
    });
    
  } catch (error) {
    console.error('Cancel registration error:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Server error while cancelling registration'
    });
  }
});

// Export router
module.exports = router;
