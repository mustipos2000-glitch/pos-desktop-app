const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Mailtrap configuration
    this.transporter = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: "d7286e1afd11a3",
        pass: "1a31de5ffc70a6"
      }
    });
  }

  /**
   * Send receipt email
   */
  async sendReceiptEmail(receiptData) {
    try {
      const {
        email,
        transaction_id,
        payment_method,
        amount,
        member_name,
        payment_type,
        details,
        timestamp
      } = receiptData;

      // Format timestamp
      const date = new Date(timestamp);
      const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const formattedTime = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      // Create email HTML
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #2c3e50;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: #f9f9f9;
              padding: 30px;
              border: 1px solid #ddd;
              border-top: none;
            }
            .receipt-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #ddd;
            }
            .receipt-row:last-child {
              border-bottom: none;
            }
            .label {
              font-weight: bold;
              color: #555;
            }
            .value {
              color: #333;
            }
            .total {
              font-size: 1.3em;
              font-weight: bold;
              color: #27ae60;
              margin-top: 20px;
              padding-top: 20px;
              border-top: 2px solid #27ae60;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #777;
              font-size: 0.9em;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Payment Receipt</h1>
            <p>Thank you for your payment</p>
          </div>
          
          <div class="content">
            <div class="receipt-row">
              <span class="label">Transaction ID:</span>
              <span class="value">${transaction_id}</span>
            </div>
            
            <div class="receipt-row">
              <span class="label">Date:</span>
              <span class="value">${formattedDate}</span>
            </div>
            
            <div class="receipt-row">
              <span class="label">Time:</span>
              <span class="value">${formattedTime}</span>
            </div>
            
            <div class="receipt-row">
              <span class="label">Member:</span>
              <span class="value">${member_name}</span>
            </div>
            
            <div class="receipt-row">
              <span class="label">Payment Type:</span>
              <span class="value">${payment_type}</span>
            </div>
            
            ${details ? `
            <div class="receipt-row">
              <span class="label">Details:</span>
              <span class="value">${details}</span>
            </div>
            ` : ''}
            
            <div class="receipt-row">
              <span class="label">Payment Method:</span>
              <span class="value">${payment_method}</span>
            </div>
            
            <div class="total">
              <div class="receipt-row">
                <span class="label">Total Amount:</span>
                <span class="value">€ ${amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p>This is an automated receipt. Please keep it for your records.</p>
            <p>If you have any questions, please contact us.</p>
          </div>
        </body>
        </html>
      `;

      // Send email
      const info = await this.transporter.sendMail({
        from: '"Mosque Payment System" <noreply@mosque.com>',
        to: email,
        subject: `Payment Receipt - ${transaction_id}`,
        html: htmlContent
      });

      console.log('✅ Email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Email send error:', error);
      return { success: false, message: error.message };
    }
  }
}

module.exports = new EmailService();
