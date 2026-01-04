# Main Admin Dashboard - Complete Guide

## 🎯 Overview

The Main Admin Dashboard is a powerful monitoring and management system accessible at `/main.admin`. It provides complete oversight of all users, payments, and system activity with email notification capabilities.

---

## 🚀 Features

### 1. **User Management**
- View all registered users with detailed information
- Lock/unlock user accounts
- Monitor user activity and status
- View user profile pictures and details

### 2. **Payment Monitoring**
- Track all payments (paid, pending, overdue)
- View payment history for each user
- Monitor total revenue
- Identify users with payment issues

### 3. **Email System**
- Send emails to individual users
- Bulk email to selected users
- Payment reminder emails
- Custom email templates

### 4. **Statistics Dashboard**
- Total users count
- Active vs locked users
- Total revenue tracking
- Pending and overdue payments count

### 5. **Advanced Filtering**
- Filter by user status (active, locked)
- Filter by payment status (pending, overdue)
- Search users by name or email
- Multi-select for bulk actions

---

## 📊 Dashboard Sections

### Stats Cards (Top Row)
1. **Total Users** - Total number of registered users
2. **Active Users** - Users with active accounts
3. **Locked Users** - Users whose accounts are locked
4. **Total Revenue** - Sum of all paid subscriptions
5. **Pending Payments** - Number of pending payments
6. **Overdue Payments** - Number of overdue payments

### User Table
Displays comprehensive user information:
- **Checkbox** - Select users for bulk actions
- **User Info** - Profile picture, name, email
- **Plan** - Subscription plan (Basic/Ultra) and price
- **Status** - Active, Locked, or Inactive
- **Payments** - Payment status breakdown
- **Joined Date** - Account creation date
- **Actions** - Lock/Unlock and Send Reminder buttons

---

## 🔧 How to Use

### Accessing the Dashboard
1. Navigate to: `http://localhost:5173/main.admin`
2. No authentication required (add authentication if needed)

### Locking/Unlocking Users
1. Find the user in the table
2. Click the Lock/Unlock icon button
3. Locked users cannot access their accounts

### Sending Payment Reminders
1. Find the user with pending/overdue payments
2. Click the "Send" icon button
3. Automated reminder email will be sent

### Bulk Email to Users
1. Select users using checkboxes
2. Click "Send Email to Selected" button
3. Enter email subject and message
4. Click "Send Email"

### Filtering Users
Use the filter dropdown to view:
- **All Users** - Complete user list
- **Active** - Only active users
- **Locked** - Only locked accounts
- **Pending Payment** - Users with pending payments
- **Overdue** - Users with overdue payments

### Searching Users
- Type in the search box to filter by name or email
- Search works in real-time

---

## 📧 Email Integration

### Current Implementation
- Emails are logged to `emails.json` file
- Email records include: user, subject, message, timestamp

### Production Setup
To integrate with real email service:

1. **Using SendGrid:**
```python
import sendgrid
from sendgrid.helpers.mail import Mail

sg = sendgrid.SendGridAPIClient(api_key=os.environ.get('SENDGRID_API_KEY'))

def send_email(to_email, subject, message):
    mail = Mail(
        from_email='noreply@yourapp.com',
        to_emails=to_email,
        subject=subject,
        plain_text_content=message
    )
    response = sg.send(mail)
    return response
```

2. **Using Mailgun:**
```python
import requests

def send_email(to_email, subject, message):
    return requests.post(
        "https://api.mailgun.net/v3/YOUR_DOMAIN/messages",
        auth=("api", "YOUR_API_KEY"),
        data={
            "from": "noreply@yourapp.com",
            "to": [to_email],
            "subject": subject,
            "text": message
        }
    )
```

3. **Using SMTP (Gmail):**
```python
import smtplib
from email.mime.text import MIMEText

def send_email(to_email, subject, message):
    msg = MIMEText(message)
    msg['Subject'] = subject
    msg['From'] = 'your-email@gmail.com'
    msg['To'] = to_email
    
    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
        smtp.login('your-email@gmail.com', 'your-app-password')
        smtp.send_message(msg)
```

---

## 💾 Data Structure

### Users JSON
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "role": "admin",
  "plan": "ultra",
  "price": 1600,
  "active": true,
  "locked": false,
  "profilePicture": "base64...",
  "createdAt": "2024-01-01T00:00:00"
}
```

### Payments JSON
```json
{
  "id": 1,
  "userId": 1,
  "amount": 1600,
  "plan": "ultra",
  "status": "pending",
  "dueDate": "2024-02-01",
  "createdAt": "2024-01-01T00:00:00",
  "paidAt": null
}
```

### Emails JSON
```json
{
  "id": 1,
  "userId": 1,
  "userEmail": "user@example.com",
  "userName": "John Doe",
  "subject": "Payment Reminder",
  "message": "Please complete your payment...",
  "status": "sent",
  "sentAt": "2024-01-01T00:00:00"
}
```

---

## 🔐 Security Considerations

### For Production:

1. **Add Authentication**
```jsx
// Add to MainAdmin.jsx
const { user } = useAuth();

if (!user || user.role !== 'super-admin') {
  return <Navigate to="/login" />;
}
```

2. **Add Backend Authorization**
```python
@app.route('/api/main-admin/users', methods=['GET'])
@token_required
def main_admin_get_users():
    # Check if user is super admin
    if request.user.get('role') != 'super-admin':
        return jsonify({'error': 'Unauthorized'}), 403
    # ... rest of code
```

3. **Environment Variables**
```bash
# .env file
MAIN_ADMIN_EMAIL=admin@yourapp.com
MAIN_ADMIN_PASSWORD=secure-password
SENDGRID_API_KEY=your-api-key
```

---

## 🎨 UI Features

### Design Elements
- **Dark gradient background** - Professional look
- **Glassmorphism cards** - Modern UI with backdrop blur
- **Color-coded status** - Easy visual identification
- **Responsive design** - Works on all screen sizes
- **Smooth animations** - Enhanced user experience

### Color Scheme
- **Blue** - Primary actions, active users
- **Purple** - Accent color, premium features
- **Green** - Paid status, success states
- **Orange** - Pending status, warnings
- **Red** - Overdue, locked, errors

---

## 📱 Responsive Behavior

- **Desktop (1200px+)**: 6-column stats grid, full table
- **Tablet (768px-1199px)**: 3-column stats grid, scrollable table
- **Mobile (<768px)**: 2-column stats grid, card-based layout

---

## 🔄 Automated Features

### Payment Status Updates
Payments automatically transition:
- **Pending** → **Overdue** (after due date)
- **Pending** → **Paid** (when payment received)

### Email Triggers
Automatic emails can be sent for:
- New user registration
- Payment due reminders (3 days before)
- Overdue payment notifications
- Account locked notifications

---

## 📈 Future Enhancements

1. **Analytics Dashboard**
   - Revenue charts
   - User growth graphs
   - Payment trends

2. **Export Features**
   - Export user list to CSV
   - Export payment reports
   - Email history export

3. **Automated Workflows**
   - Auto-lock after X days overdue
   - Scheduled reminder emails
   - Escalation system

4. **Advanced Filtering**
   - Date range filters
   - Revenue range filters
   - Custom filter combinations

5. **Audit Logs**
   - Track all admin actions
   - User activity logs
   - Payment history timeline

---

## 🐛 Troubleshooting

### Users Not Loading
- Check backend is running on port 5001
- Verify `users.json` exists in `src/backend/data/`
- Check browser console for errors

### Emails Not Sending
- Verify email service configuration
- Check `emails.json` for logged emails
- Ensure API endpoint is accessible

### Lock/Unlock Not Working
- Check user has `locked` field in database
- Verify backend endpoint is responding
- Check browser network tab for errors

---

## 📞 Support

For issues or questions:
1. Check `IMPLEMENTATION_COMPLETE.md` for feature documentation
2. Review `INTEGRATION_GUIDE.md` for integration help
3. Check browser console and network tab for errors

---

## ✅ Testing Checklist

- [ ] Access dashboard at `/main.admin`
- [ ] View all users in table
- [ ] Lock a user account
- [ ] Unlock a user account
- [ ] Send payment reminder to single user
- [ ] Select multiple users
- [ ] Send bulk email to selected users
- [ ] Filter by active users
- [ ] Filter by locked users
- [ ] Filter by pending payments
- [ ] Filter by overdue payments
- [ ] Search users by name
- [ ] Search users by email
- [ ] View payment statistics
- [ ] Check email logs in `emails.json`

---

## 🎯 Quick Start

1. **Start Backend:**
```bash
cd my-react-app/src/backend
python app.py
```

2. **Start Frontend:**
```bash
cd my-react-app
npm run dev
```

3. **Access Dashboard:**
```
http://localhost:5173/main.admin
```

4. **Test Features:**
- Create some test users via signup
- Create test payment records
- Try locking/unlocking users
- Send test emails

---

Your Main Admin Dashboard is now fully functional and ready to use!