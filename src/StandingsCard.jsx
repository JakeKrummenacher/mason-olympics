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
  const [loading, setLoading] = useState(true);

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
        let lastValidValues = { gold: 0, silver: 0, bronze: 0, total: 0 };

        tableRows.each((index, element) => {
          const row = $(element);
          const rank = row.find("td:nth-child(1)").text().trim();
          const country = row.find("a:nth-child(2)").text().trim();

          let gold = parseInt(row.find("td:nth-child(3)").text().trim(), 10) || 0;
          let silver = parseInt(row.find("td:nth-child(4)").text().trim(), 10) || 0;
          let bronze = parseInt(row.find("td:nth-child(5)").text().trim(), 10) || 0;
          let total = parseInt(row.find("td:nth-child(6)").text().trim(), 10) || 0;

          if (!rank) {
            gold = lastValidValues.gold;
            silver = lastValidValues.silver;
            bronze = lastValidValues.bronze;
            total = lastValidValues.total;
          }

          if (country) {
            data.push({ rank, country, gold, silver, bronze, total });
            if (rank) {
              lastValidValues = { gold, silver, bronze, total };
            }
          }
        });

        setMedalData(data);
        setFamilyScores(calculateFamilyScores(data));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching the medal table:", error);
        setLoading(false);
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

  if (loading) {
    return (
      <div role="status" className="absolute w-screen h-screen flex items-center justify-center">
        <svg
          aria-hidden="true"
          className="w-24 h-24 text-gray-400 animate-spin dark:text-gray-600 fill-blue-600"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="currentColor"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentFill"
          />
        </svg>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full container p-4 md:p-12 space-y-8 items-center">
      <div className="bg-white shadow-lg rounded-lg p-4 md:p-6">
        <h2 className="text-xl font-bold mb-4">Family Draft Scores</h2>
        <div className="overflow-x-auto">
          <table className="table-auto w-full">
            <thead>
              <tr>
                <th className="px-2 md:px-4 py-2">Rank</th>
                <th className="px-2 md:px-4 py-2">Family Member</th>
                <th className="px-2 md:px-4 py-2">Score</th>
              </tr>
            </thead>
            <tbody>
              {rankedFamilyScores.map((row, index) => (
                <tr key={index}>
                  <td className="border px-2 md:px-4 py-2">{row.rank}</td>
                  <td className="border px-2 md:px-4 py-2">{row.member}</td>
                  <td className="border px-2 md:px-4 py-2">{row.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-white shadow-lg rounded-lg p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-4">
          Standings for Drafted Countries
        </h1>
        <div className="overflow-x-auto">
          <table className="table-auto w-full">
            <thead>
              <tr>
                <th className="px-2 md:px-4 py-2">Country</th>
                <th className="px-2 md:px-4 py-2">Gold</th>
                <th className="px-2 md:px-4 py-2">Silver</th>
                <th className="px-2 md:px-4 py-2">Bronze</th>
                <th className="px-2 md:px-4 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredMedalData.map((row, index) => (
                <tr key={index}>
                  <td className="border px-2 md:px-4 py-2">{row.country}</td>
                  <td className="border px-2 md:px-4 py-2">{row.gold}</td>
                  <td className="border px-2 md:px-4 py-2">{row.silver}</td>
                  <td className="border px-2 md:px-4 py-2">{row.bronze}</td>
                  <td className="border px-2 md:px-4 py-2">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MedalTable;
