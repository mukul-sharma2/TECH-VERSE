const Registration = require("../models/Registration");
const { Parser } = require("json2csv");

const registerTeam = async (req, res) => {
  try {
    const registration = new Registration(req.body);
    await registration.save();
    res.status(201).json({ message: "Team registered successfully!" });
  } catch (error) {
    console.error("Error saving registration:", error);
    res.status(500).json({ message: "Error submitting form", error });
  }
};

const getRegistrationsCSV = async (req, res) => {
  try {
    
    const apiKey = req.headers["x-api-key"];
    if (apiKey !== process.env.REGISTRATION_FORM_KEY) {
      return res.status(403).json({ message: "Unauthorized: Invalid API Key" });
    }
    const data = await Registration.find().lean();
    const parser = new Parser();
    const csv = parser.parse(data);
    res.header("Content-Type", "text/csv");
    res.attachment("registrations.csv");
    res.send(csv);
  } catch (err) {
    console.error("Error generating CSV:", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  registerTeam,
  getRegistrationsCSV,
};
