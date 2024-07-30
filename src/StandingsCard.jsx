import React, { useEffect, useState } from "react";
import axios from "axios";
import cheerio from "cheerio";

const familyDraft = {
  Lily: ["Peru", "Germany", "Sweden"],
  Tera: ["France", "Croatia", "Egypt"],
  Elise: ["Italy", "Portugal", "South Africa"],
  Grace: ["China", "Mexico", "Jamaica"],
  Jake: ["Japan", "New Zealand", "Slovenia"],
  Will: ["Ukraine", "Turkey", "Colombia"],
  Mike: ["Israel", "South Korea", "Spain"],
};

const calculateFamilyScores = (medalData) => {
  const scores = {};

  for (const member in familyDraft) {
    scores[member] = 0;

    familyDraft[member].forEach((country) => {
      const countryData = medalData.find((item) =>
        item.country.includes(country)
      );
      if (countryData) {
        scores[member] +=
          countryData.gold * 3 +
          countryData.silver * 2 +
          countryData.bronze * 1;
      }
    });
  }

  return scores;
};

const MedalTable = () => {
  const [medalData, setMedalData] = useState([]);
  const [familyScores, setFamilyScores] = useState({});

  useEffect(() => {
    const fetchMedalTable = async () => {
      try {
        const response = await axios.get(
          "https://api.allorigins.win/raw?url=https://en.wikipedia.org/wiki/2024_Summer_Olympics_medal_table"
        );
        const html = response.data;

        const $ = cheerio.load(html);

        const tableRows = $("table.wikitable tbody tr");

        const data = [];

        tableRows.each((index, element) => {
          const row = $(element);
          const country = row.find("a:nth-child(2)").text().trim();
          const gold =
            parseInt(row.find("td:nth-child(3)").text().trim(), 10) || 0;
          const silver =
            parseInt(row.find("td:nth-child(4)").text().trim(), 10) || 0;
          const bronze =
            parseInt(row.find("td:nth-child(5)").text().trim(), 10) || 0;
          const total =
            parseInt(row.find("td:nth-child(6)").text().trim(), 10) || 0;

          if (country) {
            data.push({ country, gold, silver, bronze, total });
          }
        });

        setMedalData(data);
        setFamilyScores(calculateFamilyScores(data));
      } catch (error) {
        console.error("Error fetching the medal table:", error);
      }
    };

    fetchMedalTable();
  }, []);

  const getRankedFamilyScores = () => {
    const sortedScores = Object.entries(familyScores).sort(
      (a, b) => b[1] - a[1]
    );
    return sortedScores.map(([member, score], index) => ({
      member,
      score,
      rank: index + 1,
    }));
  };

  const rankedFamilyScores = getRankedFamilyScores();

  const draftCountries = new Set(Object.values(familyDraft).flat());

  const filteredMedalData = medalData.filter((row) =>
    draftCountries.has(row.country)
  );

  return (
    <div className="h-full container p-12 space-y-8">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Family Draft Scores</h2>
        <table className="table-auto w-full">
          <thead>
            <tr>
              <th className="px-4 py-2">Rank</th>
              <th className="px-4 py-2">Family Member</th>
              <th className="px-4 py-2">Score</th>
            </tr>
          </thead>
          <tbody>
            {rankedFamilyScores.map((row, index) => (
              <tr key={index}>
                <td className="border px-4 py-2">{row.rank}</td>
                <td className="border px-4 py-2">{row.member}</td>
                <td className="border px-4 py-2">{row.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">
          2024 Summer Olympics Medal Table
        </h1>
        <table className="table-auto w-full">
          <thead>
            <tr>
              <th className="px-4 py-2">Country</th>
              <th className="px-4 py-2">Gold</th>
              <th className="px-4 py-2">Silver</th>
              <th className="px-4 py-2">Bronze</th>
              <th className="px-4 py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {filteredMedalData.map((row, index) => (
              <tr key={index}>
                <td className="border px-4 py-2">{row.country}</td>
                <td className="border px-4 py-2">{row.gold}</td>
                <td className="border px-4 py-2">{row.silver}</td>
                <td className="border px-4 py-2">{row.bronze}</td>
                <td className="border px-4 py-2">{row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MedalTable;
