import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyInquiries, getConversation, sendMessage } from '../api'
import { useTranslation } from '../i18n'
import '../styles/pages/messages.css'

export default function MessagesPage({ auth }) {
  const navigate = useNavigate()
  const [inquiries, setInquiries] = useState([])
  const [selectedInquiry, setSelectedInquiry] = useState(null)
  const [conversation, setConversation] = useState(null)
  const [messageText, setMessageText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    if (!auth?.access) {
      navigate('/login')
      return
    }

    const loadInquiries = async () => {
      try {
        const data = await getMyInquiries(auth.access)
        setInquiries(data.results || data || [])
        if (data.length > 0) {
          setSelectedInquiry(data[0])
        }
      } catch (err) {
        console.error('Failed to load inquiries:', err)
      } finally {
        setLoading(false)
      }
    }
    loadInquiries()
  }, [auth, navigate])

  useEffect(() => {
    if (!selectedInquiry || !auth?.access) return

    const loadConversation = async () => {
      try {
        const data = await getConversation(selectedInquiry.conversation_id || selectedInquiry.id, auth.access)
        setConversation(data)
      } catch (err) {
        console.error('Failed to load conversation:', err)
      }
    }
    loadConversation()
  }, [selectedInquiry, auth])

  const handleSendMessage = async (event) => {
    event.preventDefault()
    if (!messageText.trim() || !selectedInquiry) return

    setSending(true)
    try {
      await sendMessage(
        selectedInquiry.conversation_id || selectedInquiry.id,
        auth.access,
        { content: messageText }
      )
      setMessageText('')
      // Reload conversation
      const data = await getConversation(selectedInquiry.conversation_id || selectedInquiry.id, auth.access)
      setConversation(data)
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setSending(false)
    }
  }

  if (loading) return <div className="loading">{t('messages.loading','Loading messages...')}</div>

  return (
    <div className="messages-page">
      <header className="messages-header">
        <h1>{t('messages.title','Messages')}</h1>
        <p>{t('messages.subtitle','Connect with suppliers and manage your inquiries')}</p>
      </header>

      <div className="messages-container">
        <aside className="inquiries-sidebar">
          <div className="inquiries-title">
            <h3>{t('messages.inquiriesTitle','Inquiries')} ({inquiries.length})</h3>
          </div>
          <div className="inquiries-list">
            {inquiries.length > 0 ? (
              inquiries.map((inquiry) => (
                <button
                  key={inquiry.id}
                  className={`inquiry-item ${selectedInquiry?.id === inquiry.id ? 'active' : ''}`}
                  onClick={() => setSelectedInquiry(inquiry)}
                >
                  <div className="inquiry-header">
                    <strong>{inquiry.supplier_name || t('messages.supplier','Supplier')}</strong>
                    <span className="inquiry-status">{inquiry.status || t('messages.open','Open')}</span>
                  </div>
                  <p className="inquiry-subject">{inquiry.subject}</p>
                  <span className="inquiry-date">{new Date(inquiry.created_at).toLocaleDateString()}</span>
                </button>
              ))
            ) : (
              <p className="no-inquiries">{t('messages.noInquiries','No inquiries yet')}</p>
            )}
          </div>
        </aside>

        <div className="conversation-panel">
          {selectedInquiry && conversation ? (
            <>
              <div className="conversation-header">
                <h2>{selectedInquiry.supplier_name || t('messages.supplier','Supplier')}</h2>
                <p className="inquiry-subject">{selectedInquiry.subject}</p>
              </div>

              <div className="messages-list">
                {conversation.messages && conversation.messages.length > 0 ? (
                  conversation.messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`message-item ${msg.sender_type === 'buyer' ? 'buyer' : 'supplier'}`}
                    >
                      <div className="message-content">{msg.content}</div>
                      <span className="message-time">{new Date(msg.created_at).toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <p className="no-messages">{t('messages.noMessages','No messages yet')}</p>
                )}
              </div>

              <form className="message-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={t('messages.typePlaceholder','Type your message...')}
                  disabled={sending}
                />
                <button type="submit" className="button button-primary" disabled={sending}>
                  {sending ? t('messages.sending','Sending...') : t('messages.send','Send')}
                </button>
              </form>
            </>
          ) : (
            <div className="no-conversation">
              <p>Select an inquiry to view messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
