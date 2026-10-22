const LostCodeRegistration = require("../models/LostCodeRegistration");
const { Parser } = require("json2csv");

const registerLostCodeTeam = async (req, res) => {
  try {
    const { teamSize, members } = req.body;
    let teamName = req.body.teamName;

    if (!teamName || typeof teamName !== 'string' || teamName.trim() === '') {
      const leaderName = members?.[0]?.name ? members[0].name.trim().split(' ')[0] : 'Crew';
      const cleanLeader = leaderName.replace(/[^a-zA-Z0-9]/g, '') || 'Crew';
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      teamName = `LostCode-${cleanLeader}-${randomSuffix}`;
    }

    const registration = new LostCodeRegistration({
      teamName: teamName.trim(),
      teamSize: Number(teamSize),
      members: members.map((m, idx) => ({
        name: m.name.trim(),
        regNo: m.regNo.trim(),
        course: m.course.trim(),
        year: m.year.trim(),
        phone: m.phone.trim(),
        email: m.email.trim(),
        role: m.role || (idx === 0 ? 'Captain' : idx === 1 ? 'Navigator' : idx === 2 ? 'Chronicler' : 'Cipher Master'),
      })),
    });

    await registration.save();

    res.status(201).json({
      message: "Crew registered successfully in Lost Code!",
      data: registration,
    });
  } catch (error) {
    console.error("Error saving Lost Code registration:", error);
    res.status(500).json({
      message: "Failed to record Lost Code registration",
      error: error.message || error,
    });
  }
};

const getLostCodeRegistrations = async (req, res) => {
  try {
    const registrations = await LostCodeRegistration.find().sort({ createdAt: -1 });
    res.status(200).json(registrations);
  } catch (error) {
    console.error("Error fetching Lost Code registrations:", error);
    res.status(500).json({ message: error.message });
  }
};

const getLostCodeCSV = async (req, res) => {
  try {
    const apiKey = req.headers["x-api-key"];
    if (apiKey && process.env.REGISTRATION_FORM_KEY && apiKey !== process.env.REGISTRATION_FORM_KEY) {
      return res.status(403).json({ message: "Unauthorized: Invalid API Key" });
    }

    const data = await LostCodeRegistration.find().lean();
    
    // Flatten data for CSV
    const flattened = [];
    data.forEach((reg) => {
      reg.members.forEach((m, idx) => {
        flattened.push({
          teamName: reg.teamName,
          teamSize: reg.teamSize,
          registeredAt: reg.createdAt,
          memberIndex: idx + 1,
          role: m.role || (idx === 0 ? 'Captain' : 'Crew'),
          name: m.name,
          regNo: m.regNo,
          course: m.course,
          year: m.year,
          phone: m.phone,
          email: m.email,
        });
      });
    });

    const parser = new Parser();
    const csv = parser.parse(flattened);
    res.header("Content-Type", "text/csv");
    res.attachment("lostcode_registrations.csv");
    res.send(csv);
  } catch (error) {
    console.error("Error generating Lost Code CSV:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerLostCodeTeam,
  getLostCodeRegistrations,
  getLostCodeCSV,
};

