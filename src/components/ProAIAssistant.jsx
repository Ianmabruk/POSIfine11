import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * AI Assistant for Pro plan users
 * Provides business-specific advice for clinics, bars, hotels, etc.
 */
export default function ProAIAssistant({ role, businessType, adminMode = false }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  const emailTemplates = [
    {
      label: 'Schedule Change',
      prompt: 'Draft an email to staff about schedule changes for next week.'
    },
    {
      label: 'Sales Targets',
      prompt: 'Draft an email to staff announcing new weekly sales targets and motivation.'
    },
    {
      label: 'Low Stock Alert',
      prompt: 'Draft an email to suppliers requesting urgent restock of top-selling items.'
    },
    {
      label: 'Customer Promo',
      prompt: 'Draft a customer email promoting a weekend discount campaign.'
    }
  ];

  const askAI = async () => {
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please login to use AI assistant');
      }

      const endpoint = adminMode ? '/api/ai/ask' : '/api/ai/pro/ask';

      const response = await axios.post(
        `${API_BASE}${endpoint}`,
        {
          question: question.trim(),
          context: {
            role,
            businessType
          }
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const aiAnswer = response.data?.data?.answer || response.data?.answer;
      
      if (!aiAnswer) {
        throw new Error('No response received from AI assistant');
      }
      
      setAnswer(aiAnswer);

      // Add to history
      setHistory(prev => [
        ...prev,
        {
          question: question.trim(),
          answer: aiAnswer,
          timestamp: new Date().toISOString()
        }
      ]);

      // Clear question
      setQuestion('');
    } catch (err) {
      console.error('AI assistant error:', err);
      
      let errorMessage = 'Failed to get AI response';
      
      if (err.response?.status === 401) {
        errorMessage = 'Please login to use AI assistant';
      } else if (err.response?.status === 403) {
        errorMessage = err.response?.data?.message || (adminMode ? 'Admin access required' : 'AI assistant requires Pro plan');
      } else if (err.response?.status === 500) {
        errorMessage = 'AI service temporarily unavailable. Using fallback mode.';
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      askAI();
    }
  };

  const clearHistory = () => {
    setHistory([]);
    setAnswer('');
    setError(null);
  };

  const applyTemplate = (templatePrompt) => {
    setQuestion(templatePrompt);
  };

  return (
    <div className="pro-ai-assistant">
      <div className="assistant-header">
        <h3>🤖 AI Business Assistant</h3>
        <span className="business-badge">{businessType || 'General'}</span>
      </div>

      <div className="assistant-content">
        {/* Current Answer */}
        {answer && (
          <div className="current-answer">
            <div className="answer-header">
              <span className="ai-badge">AI Response</span>
            </div>
            <pre className="answer-text">{answer}</pre>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="assistant-error">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {/* Input Area */}
        <div className="assistant-input">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Ask AI about ${businessType || 'your business'}...\nExample: "How can I increase sales?" or "Draft an email to staff about schedule changes"`}
            rows={4}
            disabled={loading}
          />
          
          <div className="assistant-actions">
            <button
              onClick={askAI}
              disabled={loading || !question.trim()}
              className="ask-btn"
            >
              {loading ? 'Thinking...' : '✨ Ask AI'}
            </button>
            {history.length > 0 && (
              <button onClick={clearHistory} className="clear-btn">
                Clear History
              </button>
            )}
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="assistant-history">
            <h4>Recent Questions</h4>
            <div className="history-list">
              {history.slice().reverse().map((item, idx) => (
                <div key={idx} className="history-item">
                  <div className="history-question">
                    <strong>Q:</strong> {item.question}
                  </div>
                  <div className="history-answer">
                    <strong>A:</strong> {item.answer}
                  </div>
                  <div className="history-time">
                    {new Date(item.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {!answer && !loading && (
          <div className="assistant-suggestions">
            <p>💡 Try asking:</p>
            <ul>
              {businessType === 'bar' && (
                <>
                  <li onClick={() => setQuestion('What are the best-selling drinks?')}>
                    What are the best-selling drinks?
                  </li>
                  <li onClick={() => setQuestion('How to reduce bar waste?')}>
                    How to reduce bar waste?
                  </li>
                </>
              )}
              {businessType === 'clinic' && (
                <>
                  <li onClick={() => setQuestion('How to optimize appointment scheduling?')}>
                    How to optimize appointment scheduling?
                  </li>
                  <li onClick={() => setQuestion('Patient retention strategies?')}>
                    Patient retention strategies?
                  </li>
                </>
              )}
              {businessType === 'hotel' && (
                <>
                  <li onClick={() => setQuestion('How to improve occupancy rates?')}>
                    How to improve occupancy rates?
                  </li>
                  <li onClick={() => setQuestion('Guest satisfaction tips?')}>
                    Guest satisfaction tips?
                  </li>
                </>
              )}
              <li onClick={() => setQuestion('What are my top revenue opportunities?')}>
                What are my top revenue opportunities?
              </li>
              <li onClick={() => setQuestion('How to reduce operational costs?')}>
                How to reduce operational costs?
              </li>
              <li onClick={() => setQuestion('Draft an email to staff about new sales targets.')}> 
                Draft an email to staff about new sales targets.
              </li>
            </ul>
          </div>
        )}

        {/* Email Templates */}
        {!loading && (
          <div className="assistant-suggestions mt-4">
            <p>✉️ Email templates:</p>
            <ul>
              {emailTemplates.map((tpl) => (
                <li key={tpl.label} onClick={() => applyTemplate(tpl.prompt)}>
                  {tpl.label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
