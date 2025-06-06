const express = require("express");
const router = express.Router();
const axios = require("axios");
const getScore = require("../utils/scoring");
const generateSummary = require("../utils/summary");

const headers = {
  Authorization: `token ${process.env.GITHUB_TOKEN}`,
  Accept: 'application/vnd.github.v3+json',
};

router.get("/username", async (req, res) => {
    const {username} = req.params;
    try{
        const { data: repos} = await axios.get('https://github.com/<username>?tab=repositories',  { headers });
        

        if (!Array.isArray(repos)){
            return res.status(404).json({error: "Github Profile not Found"});
       
        }
        
        const score = getScore(repos);
        const summary = generateSummary(repos);

        res.json({username, score, summary});
    }catch (err){
        res.status(500).json({error: "Server error."});
    }
});

module.exports = router;