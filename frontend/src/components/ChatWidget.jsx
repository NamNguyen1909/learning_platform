import React, { useState, useEffect } from 'react';
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator,
} from '@chatscope/chat-ui-kit-react';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import { Fab, Box, Modal, IconButton, Typography } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import api, { endpoints } from '../services/apis';
import authUtils from '../services/auth';

const ChatWidget = ({ courseId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      message: "Xin chào! Tôi là AI Tutor. Bạn có câu hỏi gì về khóa học này không?",
      sentTime: "just now",
      sender: "AI",
      direction: "incoming",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (isOpen && courseId) {
      // Fetch chat history when chat modal opens and courseId is available
      const fetchChatHistory = async () => {
        try {
          const response = await api.get(endpoints.course.history(courseId));
          // Transform question-answer pairs into message format
          const historyMessages = [];
          response.data.forEach((item) => {
            // Add user question
            historyMessages.push({
              message: item.question,
              sentTime: new Date(item.timestamp).toLocaleString(),
              sender: "User",
              direction: "outgoing",
            });
            // Add AI answer
            historyMessages.push({
              message: item.answer,
              sentTime: new Date(item.timestamp).toLocaleString(),
              sender: "AI",
              direction: "incoming",
            });
          });
          setMessages(historyMessages.length > 0 ? historyMessages : messages);
        } catch (error) {
          console.error("Failed to fetch chat history:", error);
        }
      };
      fetchChatHistory();
    }
  }, [isOpen, courseId]);

  const handleSend = async (message) => {
    if (!message.trim()) return;

    // Check if courseId is available
    if (!courseId) {
      const errorMessage = {
        message: "Không thể gửi tin nhắn. Vui lòng truy cập từ trang khóa học.",
        sentTime: "just now",
        sender: "AI",
        direction: "incoming",
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    // Add user message
    const newMessage = {
      message,
      sentTime: "just now",
      sender: "User",
      direction: "outgoing",
    };
    setMessages((prev) => [...prev, newMessage]);

    // Show typing indicator
    setIsTyping(true);

    try {
      // Call API
      const response = await api.post(endpoints.course.chat(courseId), {
        message: message,
      });

      // Add AI response
      const aiMessage = {
        message: response.data.answer,
        sentTime: "just now",
        sender: "AI",
        direction: "incoming",
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        message: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.",
        sentTime: "just now",
        sender: "AI",
        direction: "incoming",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Floating Chat Icon */}
      <Fab
        color="primary"
        aria-label="chat"
        onClick={toggleChat}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        <ChatIcon />
      </Fab>

      {/* Chat Modal */}
      <Modal
        open={isOpen}
        onClose={toggleChat}
        aria-labelledby="chat-modal"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            width: '90%',
            maxWidth: 400,
            height: '80%',
            maxHeight: 600,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              borderBottom: '1px solid #e0e0e0',
            }}
          >
            <Typography variant="h6">AI Tutor</Typography>
            <IconButton onClick={toggleChat}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Chat Container */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <MainContainer style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <ChatContainer style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <MessageList
                  style={{ flex: 1, minHeight: 0 }}
                  scrollBehavior="smooth"
                  autoScrollToBottom
                  autoScrollToBottomOnMount
                  typingIndicator={isTyping ? <TypingIndicator content="AI đang trả lời..." /> : null}
                >
                  {messages.map((msg, index) => (
                    <Message key={index} model={msg} />
                  ))}
                </MessageList>
                <MessageInput
                  placeholder="Nhập câu hỏi của bạn..."
                  onSend={handleSend}
                  attachButton={false}
                />
              </ChatContainer>
            </MainContainer>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default ChatWidget;
