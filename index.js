const { App } = require("@slack/bolt");
const anon_feedback = require("./anon-feedback")
const anon_feedback_store = require("./anon-feedback-store");

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN
});

anon_feedback.add(app);

// Start your app
(async () => {
  await app.start(process.env.PORT || 3000).then(anon_feedback_store.readAnonPollData);
  console.log("⚡️ Bolt app is running!");
})();
