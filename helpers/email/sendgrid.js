const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendMail(payload) {
  const msg = {
    to: payload.to,
    from: payload.from,
    // cc: ['jayanth.prabhu@inkqubits.com', 'anjireddy@inkqubits.com'],
    // bcc: ['jayanth.prabhu@inkqubits.com', 'anjireddy@inkqubits.com'],
    subject: payload.subject,
    html: payload.html,
  };

  sgMail.send(msg).then(
    () => {},
    (error) => {
      console.error(error);

      if (error.response) {
        console.error(error.response.body);
      }
    }
  );
}

module.exports.sendMail = sendMail;
