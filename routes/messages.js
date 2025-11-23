const express = require("express");
const router = express.Router();
const Message = require("../model/message");
const User = require("../model/user");

// Get or create conversation for user
router.get("/conversation", async (req, res) => {
  try {
    const { userEmail } = req.query;

    if (!userEmail) {
      return res.status(400).json({
        status: "error",
        message: "User email is required",
      });
    }

    let conversation = await Message.findOne({ userEmail });

    if (!conversation) {
      // Get user name
      const user = await User.findOne({ email: userEmail });
      const userName = user ? user.name : "User";

      // Create new conversation with welcome message
      conversation = await Message.create({
        userEmail,
        userName,
        messages: [
          {
            sender: "admin",
            message:
              "Welcome to Oxytoxin! 👋 We're here to help. If you have any questions about your orders, products, or need assistance, feel free to message us anytime!",
            timestamp: new Date(),
            read: false,
          },
        ],
        status: "open",
        lastMessageAt: new Date(),
      });
    }

    res.status(200).json({
      status: "success",
      data: conversation,
    });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({
      status: "error",
      message: "Error fetching conversation",
      error: error.message,
    });
  }
});

// Send message from user
router.post("/send", async (req, res) => {
  try {
    const { userEmail, message } = req.body;

    if (!userEmail || !message) {
      return res.status(400).json({
        status: "error",
        message: "User email and message are required",
      });
    }

    let conversation = await Message.findOne({ userEmail });

    if (!conversation) {
      // Get user name
      const user = await User.findOne({ email: userEmail });
      const userName = user ? user.name : "User";

      // Create new conversation
      conversation = await Message.create({
        userEmail,
        userName,
        messages: [],
        status: "open",
      });
    }

    // Add new message
    conversation.messages.push({
      sender: "user",
      message: message.trim(),
      timestamp: new Date(),
      read: false,
    });

    conversation.lastMessageAt = new Date();
    conversation.status = "open";

    await conversation.save();

    res.status(200).json({
      status: "success",
      data: conversation,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({
      status: "error",
      message: "Error sending message",
      error: error.message,
    });
  }
});

// Send message from admin (reply)
router.post("/admin/reply", async (req, res) => {
  try {
    const { userEmail, message } = req.body;

    if (!userEmail || !message) {
      return res.status(400).json({
        status: "error",
        message: "User email and message are required",
      });
    }

    const conversation = await Message.findOne({ userEmail });

    if (!conversation) {
      return res.status(404).json({
        status: "error",
        message: "Conversation not found",
      });
    }

    // Add admin reply
    conversation.messages.push({
      sender: "admin",
      message: message.trim(),
      timestamp: new Date(),
      read: false,
    });

    conversation.lastMessageAt = new Date();

    await conversation.save();

    res.status(200).json({
      status: "success",
      data: conversation,
    });
  } catch (error) {
    console.error("Error sending admin reply:", error);
    res.status(500).json({
      status: "error",
      message: "Error sending reply",
      error: error.message,
    });
  }
});

// Get all conversations (admin)
router.get("/admin/conversations", async (req, res) => {
  try {
    const { status } = req.query;

    let query = {};
    if (status && status !== "all") {
      query.status = status;
    }

    const conversations = await Message.find(query)
      .sort({ lastMessageAt: -1 })
      .limit(100);

    // Count unread messages for each conversation
    const conversationsWithUnread = conversations.map((conv) => {
      const unreadCount = conv.messages.filter(
        (msg) => msg.sender === "user" && !msg.read
      ).length;
      return {
        ...conv.toObject(),
        unreadCount,
      };
    });

    res.status(200).json({
      status: "success",
      data: conversationsWithUnread,
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({
      status: "error",
      message: "Error fetching conversations",
      error: error.message,
    });
  }
});

// Mark messages as read
router.patch("/mark-read", async (req, res) => {
  try {
    const { userEmail, sender } = req.body;

    if (!userEmail || !sender) {
      return res.status(400).json({
        status: "error",
        message: "User email and sender are required",
      });
    }

    const conversation = await Message.findOne({ userEmail });

    if (!conversation) {
      return res.status(404).json({
        status: "error",
        message: "Conversation not found",
      });
    }

    // Mark messages from specified sender as read
    conversation.messages.forEach((msg) => {
      if (msg.sender === sender && !msg.read) {
        msg.read = true;
      }
    });

    await conversation.save();

    res.status(200).json({
      status: "success",
      data: conversation,
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({
      status: "error",
      message: "Error marking messages as read",
      error: error.message,
    });
  }
});

// Close conversation
router.patch("/admin/close", async (req, res) => {
  try {
    const { userEmail } = req.body;

    if (!userEmail) {
      return res.status(400).json({
        status: "error",
        message: "User email is required",
      });
    }

    const conversation = await Message.findOneAndUpdate(
      { userEmail },
      { status: "closed" },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({
        status: "error",
        message: "Conversation not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: conversation,
    });
  } catch (error) {
    console.error("Error closing conversation:", error);
    res.status(500).json({
      status: "error",
      message: "Error closing conversation",
      error: error.message,
    });
  }
});

// Get unread count for user
router.get("/unread-count", async (req, res) => {
  try {
    const { userEmail } = req.query;

    if (!userEmail) {
      return res.status(400).json({
        status: "error",
        message: "User email is required",
      });
    }

    const conversation = await Message.findOne({ userEmail });

    if (!conversation) {
      return res.status(200).json({
        status: "success",
        data: { count: 0 },
      });
    }

    const unreadCount = conversation.messages.filter(
      (msg) => msg.sender === "admin" && !msg.read
    ).length;

    res.status(200).json({
      status: "success",
      data: { count: unreadCount },
    });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({
      status: "error",
      message: "Error getting unread count",
      error: error.message,
    });
  }
});

module.exports = router;
