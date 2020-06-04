const store = require("./anon-feedback-store")

const CORONAVIRUS_CHANNEL_ID = "CV5DAQEUR";
const TEST_CHANNEL_ID = "C0AJ99X9N";

const getAnonFeedbackModal = (metadata, user_id) => {
  let text = store.userIsConcerned(metadata.message_ts, user_id) ? "You've already said that you have concerns with the proposal as-is. Please resubmit if you are no longer concerned, or would like to give additional feedback." : "Let us know if you have concerns with the proposal as-is. If two+ housemates express concern, we'll ask the proposer to wait and discuss at the next house meeting."; 
  return {
    callback_id: "anon_feedback_modal",
    private_metadata: JSON.stringify(metadata),
    type: "modal",
    title: {
      type: "plain_text",
      text: "Give anonymous feedback"
    },
    close: {
      type: "plain_text",
      text: "Close"
    },
    submit: {
      type: "plain_text",
      text: "Submit"
    },

    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: text
        },
      },{
        type: "input",
        block_id: "concerns",
        element: {
          action_id: "concerns_input",
          type: "radio_buttons",
          options: [
            {
              text: {
                type: "mrkdwn",
                text: "I have concerns with the proposal as-is."
              },
              value: "1"
            },

            {
              text: {
                type: "mrkdwn",
                text: "I am alright with the proposal as-is."
              },
              value: "0"
            }
          ]
        },
        label: {
          type: "plain_text",
          text: " ",
          emoji: true
        }
      },
      {
        type: "input",
        optional: true,
        block_id: "feedback",
        element: {
          action_id: "feedback_input",
          type: "plain_text_input",
          multiline: true
        },
        label: {
          type: "plain_text",
          text: "Any feedback? (this will be shared anonymously in channel)",
          emoji: true
        }
      }
    ]
  };
};

exports.add = app => {
  app.shortcut("anon_feedback", async ({ shortcut, ack, context, client }) => {
    try {
      // Acknowledge shortcut request
      await ack();
      let result;

      if (shortcut.channel.id == TEST_CHANNEL_ID) {
        const metadata = {
          channel: shortcut.channel,
          message_ts: shortcut.message_ts
        };
        // Call the views.open method using one of the built-in WebClients
        let view;
        view = getAnonFeedbackModal(metadata, shortcut.user.id);
        result = await client.views.open({
          // The token you used to initialize your app is stored in the `context` object
          token: context.botToken,
          trigger_id: shortcut.trigger_id,
          view: view
        });
      } else {
        result = await app.client.chat.postEphemeral({
          token: context.botToken,
          attachments: [],
          channel: shortcut.channel.id,
          user: shortcut.user.id,
          text: "Sorry, anonymous feedback only works in #coronavirus!"
        });
      }
    } catch (error) {
      console.error(error);
    }
  });

  app.view("anon_feedback_modal", async ({ ack, body, view, context }) => {
    await ack();

    const metadata = JSON.parse(view.private_metadata);
    const channel = metadata.channel.id;
    const message_ts = metadata.message_ts;
    const user_id = body.user.id;
    const feedback = view.state.values.feedback.feedback_input.value;
    const has_concerns = view.state.values.concerns.concerns_input.selected_option.value == "1";
    const currently_has_concerns = store.userIsConcerned(message_ts, user_id);

    let message = "";
    
    if (has_concerns && !currently_has_concerns) {
        const polled_users = store.addConcernedUser(message_ts, user_id);

        polled_users.length == 1
          ? (message += "A housemate has concerns with the proposal as-is.")
          : (message +=
              polled_users.length +
              " housemates have concerns with the proposal as-is. Please wait until after discussing at the next house meeting.");
    } else if (!has_concerns && currently_has_concerns) {
        const polled_users= store.removeConcernedUser(message_ts, user_id);
      message += "A housemate has withdrawn their concerns."
      
      if(polled_users.length == 1) {
        message += "There is still one other housemate who has concerns."
      } else if (polled_users.length > 1) {
        message += "There are still " + polled_users.length + " housemates who have concerns. Please wait to discuss the proposal at the next house meeting.";
      }
    }

      if (feedback)
      message +=
        "\nYou've been given the following feedback:\n>" + feedback;

    if (message) {
      return app.client.chat.postMessage({
      token: context.botToken,
      channel: channel.id,
      thread_ts: message_ts,
      text: message
    });
    }
    
    
  });
};
