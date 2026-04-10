export const STATIC_TRANSCRIPT = `Session Title: Session 1—Building Trust, Self-Awareness & Resources Zoom Session Title: Building Trust, Self-Awareness & ResourcesParticipants: David Jones (Mentor/Pastor), Samuel Adams (Mentee)[00:00 – Session Begins]David Samuel, good to see you today. Can you hear me clearly?Samuel, Pastor David, loud and clear. Good to see you too.David. Let’s open in prayer before we begin.Samuel, please.David, we thank You for this time together. We invite Your presence into this conversation. Teach us to grow in trust, deepen our self-awareness, and steward the resources You’ve given us well. In Jesus’ name, amen.Samuel.[03:00 – Building Trust]David’s start with trust. When you hear the word “trust,” what comes to mind?Samuel, consistency. People doing what they say they’ll do. And I guess… feeling safe.David’s good. Trust is built on both character and consistency. How would you say your trust is with God right now?Samuel believe in Him, but sometimes I struggle to trust His timing.David’s very honest. Many people feel that way. Trust grows when we remember God’s past faithfulness. Can you think of a time He came through for you?Samuel… last year when I was struggling with work, something opened up unexpectedly.David. Those moments are anchors. When doubt comes, we return to what we know God has done.[08:00 – Trust in Relationships]David about trust with others? Is there anyone you find it hard to trust?Samuel, actually. A colleague. I feel like I have to be guarded around them.David’s understandable. Trust doesn’t mean blind openness—it means wisdom. Scripture teaches us to be “wise as serpents and innocent as doves.” Are you setting healthy boundaries?Samuel really. I either shut down or overshare.David’s a common pattern. Let’s work toward balanced trust—where you’re honest but also discerning.[12:00 – Self-Awareness]David’s move into self-awareness. How well do you feel you understand your own emotions?Samuel think I’m still learning. Sometimes I react before I even realize what I’m feeling.David’s key insight. Self-awareness begins with slowing down. When you feel triggered, ask: “What am I feeling? Why?”Samuel makes sense. I usually just push through.David through can ignore what God is trying to show you. Even Jesus paused, withdrew, and reflected. What are some emotions you’ve felt strongly this week?Samuel… and a bit of frustration.David do you think is underneath that frustration?Samuel feeling out of control.David’s powerful awareness. Often, our surface emotions hide deeper truths.[17:00 – Identity & Reflection]David me ask you this: how do you currently see yourself?Samuel’d say… someone trying to grow, but still unsure.David’s honest, but I want to remind you—your identity is not in uncertainty. It’s in Christ. Growth is part of the journey, not a sign of failure.Samuel needed to hear that.David journaling this week. Write down your thoughts, prayers, and reactions. It helps you see patterns.[20:00 – Resources: Spiritual & Practical]David let’s talk about resources. What resources has God already placed in your life?Samuel… my church, my family, and mentors like you.David are significant. Often we overlook what we already have. What about spiritual resources?Samuel… the Bible… worship.David. Those are not just routines—they are lifelines. How consistent are you with them?Samuel’ve been a bit inconsistent lately.David condemnation—just an invitation to reconnect. Even 10–15 minutes daily can realign your heart.[24:00 – Practical Application]David’s make this practical. What’s one step you can take this week to build trust with God?Samuel intentional time in prayer daily.David. And for self-awareness?Samuel my thoughts and emotions.David. And resources?Samuel out to someone in my church for accountability.David’s a strong plan.[27:00 – Encouragement & Closing]David, I want you to remember—you’re not alone in this. Growth takes time, but God is patient and faithful.Samuel you, Pastor David. This really helped me reflect.David’m glad. Let’s check in next week and see how these steps are going.Samuel good.David’s close in prayer.Father, thank You for Samuel. Strengthen his trust, deepen his awareness, and help him steward every resource You’ve given him. Guide him this week. In Jesus’ name, amen.Samuel. Thank you again.David’re welcome. Take care—see you next time.[30:00 – Session Ends]`;

export const STATIC_SUMMARY = {
    overview:
        "This session focused on building trust in God and relationships, developing self-awareness, and recognizing spiritual and relational resources for growth.",

    keyPoints: [
        "Trust in God’s timing and in relationships with wisdom",
        "Self-awareness through identifying emotions and root causes",
        "Identity rooted in Christ, not uncertainty",
        "Use of spiritual and relational resources",
        "Consistency in spiritual practices"
    ],

    advice: [
        "Reflect on God’s past faithfulness",
        "Practice balanced trust (not shut down or overshare)",
        "Pause and ask: What am I feeling? Why?",
        "Journal regularly",
        "Stay consistent with prayer and Scripture"
    ],

    actionItems: [
        "Daily prayer (10–15 minutes)",
        "Start journaling emotions and thoughts",
        "Reach out for accountability",
        "Pause before reacting emotionally"
    ],

    nextFocus: [
        "Review prayer and journaling habits",
        "Discuss trust challenges",
        "Explore emotional patterns",
        "Strengthen accountability"
    ]
};

export const parseTranscript = (text: string) => {
    if (!text) return [];

    const cleaned = text
        .replace(/Session Title:.*?Participants:.*?\]/s, "")
        .replace(/\[\d{2}:\d{2}.*?\]/g, "")
        .replace(/\s+/g, " ")
        .trim();

    const parts = cleaned.split(/(?=David|Samuel)/g);

    return parts
        .map((part, index) => {
            const match = part.match(/^(David|Samuel)[\s,.:’']*(.*)/);

            if (!match) return null;

            return {
                id: index,
                speaker: match[1],
                message: match[2].trim(),
                isMentor: match[1] === "David",
            };
        })
        .filter((item) => item && item.message.length > 0);
};