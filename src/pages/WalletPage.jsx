import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from '../i18n'
import {
  createPrePurchaseItem,
  fundPrePurchaseItem,
  getPrePurchaseItems,
  getWallet,
  getWalletTransactions,
  topUpWallet,
  withdrawFromWallet,
} from '../api'
import '../styles/pages/account.css'
import { formatCurrency, useCurrency } from '../currency'

export default function WalletPage({ auth }) {
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [prePurchaseItems, setPrePurchaseItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [transactionsLoading, setTransactionsLoading] = useState(true)
  const [itemsLoading, setItemsLoading] = useState(true)
  const [itemForm, setItemForm] = useState({ name: '', package_name: '', target_amount: '' })
  const [topupAmount, setTopupAmount] = useState('')
  const [topupMethod, setTopupMethod] = useState('wallet')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [itemMessage, setItemMessage] = useState(null)
  const [fundingAmounts, setFundingAmounts] = useState({})
  const [isCreating, setIsCreating] = useState(false)
  const [isTopingUp, setIsTopingUp] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)

  const token = auth?.access
  const { currency, rate } = useCurrency()
  const { t } = useTranslation()

  const loadData = async () => {
    if (!token) return

    try {
      const [walletData, txData, itemsData] = await Promise.all([
        getWallet(token),
        getWalletTransactions(token),
        getPrePurchaseItems(token),
      ])

      setWallet(walletData)
      setTransactions(txData?.results || txData || [])
      setPrePurchaseItems(itemsData || [])
    } catch (err) {
      console.error('Failed to load wallet data:', err)
      setItemMessage({ type: 'error', text: err.message || t('wallet.loadError', 'Could not load wallet.') })
    } finally {
      setLoading(false)
      setTransactionsLoading(false)
      setItemsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [token])

  const totalPrePurchaseTarget = useMemo(
    () => prePurchaseItems.reduce((sum, item) => sum + Number(item.target_amount || 0), 0),
    [prePurchaseItems]
  )

  const totalPrePurchasePaid = useMemo(
    () => prePurchaseItems.reduce((sum, item) => sum + Number(item.paid_amount || 0), 0),
    [prePurchaseItems]
  )

  const handleCreateItem = async (event) => {
    event.preventDefault()
    if (!token) return

    setIsCreating(true)
    try {
      const newItem = await createPrePurchaseItem(token, {
        name: itemForm.name,
        package_name: itemForm.package_name,
        target_amount: itemForm.target_amount,
      })

      setPrePurchaseItems((prev) => [newItem, ...prev])
      setItemForm({ name: '', package_name: '', target_amount: '' })
      setItemMessage({ type: 'success', text: t('wallet.goalCreated', 'Goal created successfully.') })
    } catch (err) {
      setItemMessage({ type: 'error', text: err.message || t('wallet.goalCreateError', 'Could not create goal.') })
    } finally {
      setIsCreating(false)
    }
  }

  const handleTopUp = async (event) => {
    event.preventDefault()
    if (!token) return

    const amount = Number(topupAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setItemMessage({ type: 'error', text: t('wallet.validTopup', 'Please enter a valid top-up amount.') })
      return
    }

    setIsTopingUp(true)
    try {
      const response = await topUpWallet(token, {
        amount,
        method: topupMethod,
        payment_reference: topupMethod === 'wallet' ? undefined : `WALLET-${Date.now()}`,
      })
      setTopupAmount('')
      const isPending = response?.status === 'pending'
      setItemMessage({
        type: isPending ? 'warning' : 'success',
        text: response?.message || (isPending ? 'Top-up is pending confirmation.' : t('wallet.topupSuccess', 'Wallet topped up.')),
      })
      if (!isPending) {
        await loadData()
      }
    } catch (err) {
      setItemMessage({ type: 'error', text: err.message || t('wallet.topupError', 'Could not top up wallet.') })
    } finally {
      setIsTopingUp(false)
    }
  }

  const handleWithdraw = async (event) => {
    event.preventDefault()
    if (!token) return

    const amount = Number(withdrawAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setItemMessage({ type: 'error', text: t('wallet.validWithdrawal', 'Please enter a valid withdrawal amount.') })
      return
    }

    setIsWithdrawing(true)
    try {
      const response = await withdrawFromWallet(token, { amount })
      setWithdrawAmount('')
      setItemMessage({ type: 'success', text: response.message || t('wallet.withdrawSuccess', 'Withdrawal completed.') })
      await loadData()
    } catch (err) {
      setItemMessage({ type: 'error', text: err.message || t('wallet.withdrawError', 'Could not withdraw from wallet.') })
    } finally {
      setIsWithdrawing(false)
    }
  }

  const handleFundItem = async (item) => {
    const amount = fundingAmounts[item.id]
    if (!amount || Number(amount) <= 0) {
      setItemMessage({ type: 'error', text: t('wallet.validAmount', 'Please enter a valid amount.') })
      return
    }

    try {
      const response = await fundPrePurchaseItem(token, item.id, {
        amount,
        payment_method: 'wallet',
      })

      setPrePurchaseItems((prev) =>
        prev.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                ...response.item,
              }
            : entry
        )
      )
      setFundingAmounts((prev) => ({ ...prev, [item.id]: '' }))
      setItemMessage({ type: 'success', text: response.message || t('wallet.depositSuccess', 'Deposit added.') })
      await loadData()
    } catch (err) {
      setItemMessage({ type: 'error', text: err.message || t('wallet.depositError', 'Could not add deposit.') })
    }
  }

  return (
    <div className="account-page">
      <h1>{t('wallet.title', 'Olryce Wallet')}</h1>

      {itemMessage && (
        <div className={`notification ${itemMessage.type}`}>{itemMessage.text}</div>
      )}

      <div className="account-section">
        <h2>{t('wallet.mainAccount', 'Main account')}</h2>
        {loading ? (
          <div className="loading">{t('wallet.loading', 'Loading wallet...')}</div>
        ) : wallet ? (
          <div className="wallet-summary">
            <div className="wallet-card">
              <span>{t('wallet.availableBalance', 'Available balance')}</span>
              <strong>{formatCurrency(wallet.available_balance || wallet.balance || 0, currency, rate)}</strong>
            </div>
            <div className="wallet-card">
              <span>{t('wallet.lockedBalance', 'Locked balance')}</span>
              <strong>{formatCurrency(wallet.locked_balance || 0, currency, rate)}</strong>
            </div>
            <div className="wallet-card">
              <span>{t('wallet.totalBalance', 'Total balance')}</span>
              <strong>{formatCurrency(wallet.total_balance || wallet.available_balance || 0, currency, rate)}</strong>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <p>{t('wallet.empty', 'No wallet information available yet.')}</p>
          </div>
        )}
      </div>

      <div className="account-section">
        <h2>{t('wallet.manage', 'Manage wallet')}</h2>
        <div className="form-row">
          <form onSubmit={handleTopUp} style={{ flex: 1 }}>
            <div className="form-group">
              <label>{t('wallet.topupMethod', 'Top-up method')}</label>
              <select value={topupMethod} onChange={(event) => setTopupMethod(event.target.value)}>
                <option value="wallet">Wallet</option>
                <option value="mobile_money">Mobile money</option>
                <option value="bank">Bank transfer</option>
                <option value="crypto">Crypto wallet</option>
                <option value="mpesa">M-Pesa</option>
                <option value="paypal">Online money / PayPal</option>
                <option value="stripe">Online money / Card</option>
              </select>
            </div>
            <div className="form-group">
              <label>{t('wallet.topupAmount', 'Top up amount')}</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={topupAmount}
                onChange={(event) => setTopupAmount(event.target.value)}
                placeholder={t('wallet.enterAmountPlaceholder', 'Enter amount')}
              />
            </div>
            <button className="button button-primary" type="submit" disabled={isTopingUp}>
              {isTopingUp ? t('wallet.processing', 'Processing...') : t('wallet.topup', 'Top up')}
            </button>
          </form>
          <form onSubmit={handleWithdraw} style={{ flex: 1 }}>
            <div className="form-group">
              <label>{t('wallet.withdrawAmount', 'Withdraw amount')}</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={withdrawAmount}
                onChange={(event) => setWithdrawAmount(event.target.value)}
                placeholder={t('wallet.enterAmountPlaceholder', 'Enter amount')}
              />
            </div>
            <button className="button button-secondary" type="submit" disabled={isWithdrawing}>
              {isWithdrawing ? t('wallet.processing', 'Processing...') : t('wallet.withdraw', 'Withdraw')}
            </button>
          </form>
        </div>
      </div>

      <div className="account-section">
        <h2>{t('wallet.savingsAccount', 'Savings account')}</h2>
        <div className="wallet-summary">
          <div className="wallet-card">
            <span>{t('wallet.savedBalance', 'Saved balance')}</span>
            <strong>{formatCurrency(wallet?.savings_balance || 0, currency, rate)}</strong>
          </div>
          <div className="wallet-card">
            <span>{t('wallet.prePurchaseTarget', 'Pre-purchase target')}</span>
            <strong>{formatCurrency(totalPrePurchaseTarget, currency, rate)}</strong>
          </div>
          <div className="wallet-card">
            <span>{t('wallet.prePurchasePaid', 'Pre-purchase paid')}</span>
            <strong>{formatCurrency(totalPrePurchasePaid, currency, rate)}</strong>
          </div>
        </div>
      </div>

      <div className="account-section">
        <h2>{t('wallet.addGoalTitle', 'Add a pre-purchase goal')}</h2>
        <form onSubmit={handleCreateItem}>
          <div className="form-row">
            <div className="form-group">
              <label>{t('wallet.itemName', 'Item name')}</label>
              <input
                type="text"
                value={itemForm.name}
                onChange={(event) => setItemForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder={t('wallet.itemNamePlaceholder', 'e.g. Laptop, fridge, furniture')}
                required
              />
            </div>
            <div className="form-group">
              <label>{t('wallet.packageBundle', 'Package / Bundle')}</label>
              <input
                type="text"
                value={itemForm.package_name}
                onChange={(event) => setItemForm((prev) => ({ ...prev, package_name: event.target.value }))}
                placeholder={t('wallet.packagePlaceholder', 'e.g. Premium package')}
              />
            </div>
          </div>
          <div className="form-group">
            <label>{t('wallet.targetAmount', 'Target amount')}</label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={itemForm.target_amount}
              onChange={(event) => setItemForm((prev) => ({ ...prev, target_amount: event.target.value }))}
              placeholder={t('wallet.targetAmountPlaceholder', '5000')}
              required
            />
          </div>
          <button className="button button-primary" type="submit" disabled={isCreating}>
            {isCreating ? t('wallet.saving', 'Saving...') : t('wallet.createGoal', 'Create goal')}
          </button>
        </form>
      </div>

      <div className="account-section">
        <h2>{t('wallet.myGoalsTitle', 'My pre-purchase items')}</h2>
        {itemsLoading ? (
          <div className="loading">{t('wallet.loadingGoals','Loading goals...')}</div>
        ) : prePurchaseItems.length > 0 ? (
          <div className="orders-list">
            {prePurchaseItems.map((item) => (
              <div key={item.id} className="order-item" style={{ display: 'block' }}>
                <div className="order-info" style={{ marginBottom: '0.75rem' }}>
                  <p className="order-number">{item.name}</p>
                  <p className="order-date">{item.package_name || t('wallet.generalPackage','General package')}</p>
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span>{t('wallet.paidLabel','Paid')}: {formatCurrency(item.paid_amount, currency, rate)}</span>
                    <span>{t('wallet.remainingLabel','Remaining')}: {formatCurrency(item.remaining_amount, currency, rate)}</span>
                  </div>
                  <div style={{ width: '100%', background: '#e9ecef', borderRadius: '999px', overflow: 'hidden', height: '10px' }}>
                    <div
                      style={{
                        width: `${Math.min(Number(item.progress_percentage || 0), 100)}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #0f7a57, #1ec98a)',
                      }}
                    />
                  </div>
                  <p style={{ marginTop: '0.35rem', fontSize: '0.9rem' }}>
                    {Math.round(Number(item.progress_percentage || 0))}% {t('wallet.completedLabel','completed')}
                  </p>
                </div>
                <div className="form-row" style={{ alignItems: 'end' }}>
                  <div className="form-group">
                    <label>{t('wallet.depositAmount','Deposit amount')}</label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={fundingAmounts[item.id] || ''}
                      onChange={(event) => setFundingAmounts((prev) => ({ ...prev, [item.id]: event.target.value }))}
                      placeholder={t('wallet.enterAmountPlaceholder', 'Enter amount')}
                    />
                  </div>
                  <button
                    className="button button-primary"
                    onClick={() => handleFundItem(item)}
                    type="button"
                  >
                    {t('wallet.addDeposit','Add deposit')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>{t('wallet.noGoalsYet','No pre-purchase goals yet. Add your first item to start saving for it.')}</p>
          </div>
        )}
      </div>

      <div className="account-section">
        <h2>{t('wallet.recentTransactions','Recent transactions')}</h2>
        {transactionsLoading ? (
          <div className="loading">{t('wallet.loadingTransactions','Loading transactions...')}</div>
        ) : transactions.length > 0 ? (
          <div className="orders-list">
            {transactions.map((tx) => (
              <div key={tx.id} className="order-item">
                <div className="order-info">
                  <p className="order-number">{tx.reason || tx.type || t('wallet.transaction','Transaction')}</p>
                  <p className="order-date">
                    {new Date(tx.created_at || tx.createdAt || Date.now()).toLocaleString()}
                  </p>
                </div>
                <div className="order-status">
                  <p className={`status ${String(tx.type || '').toLowerCase()}`}>
                    {tx.type || t('wallet.transaction','Transaction')}
                  </p>
                </div>
                <div className="order-total">
                  <p>{formatCurrency(tx.amount, currency, rate)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>{t('wallet.noTransactions','No transactions yet.')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
