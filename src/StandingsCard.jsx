import React, { useEffect, useState } from "react";
import axios from "axios";
import {load} from "cheerio";
import IconMedal from "./IconMedal";
import LoadingIcon from "./LoadingIcon";

const familyDraft = {
  Jake: ["Finland", "South Korea", "Slovakia"],
  Lily: ["Austria", "Netherlands", "Poland"],
  Tera: ["France", "Belgium", "Individual Neutral Athletes"],
  Elise: ["Canada", "Slovenia", "Ukraine"],
  Grace: ["United States", "Denmark", "Bulgaria"],
  Will: ["Germany", "Great Britain", "New Zealand"],
  Mike: ["Norway", "Sweden", "Australia"],
};

const calculateFamilyScores = (medalData) => {
  const scores = {};

  for (const member in familyDraft) {
    scores[member] = { gold: 0, silver: 0, bronze: 0, total: 0, score: 0 };

    familyDraft[member].forEach((country) => {
      const countryData = medalData.find((item) =>
        item.country.includes(country)
      );
      if (countryData) {
        scores[member].gold += countryData.gold;
        scores[member].silver += countryData.silver;
        scores[member].bronze += countryData.bronze;
        scores[member].total += countryData.total;
        scores[member].score +=
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
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMedalTable = async () => {
      try {
        const response = await axios.get(
          "https://api.allorigins.win/raw?url=https://en.wikipedia.org/wiki/2026_Winter_Olympics_medal_table"
        );
        const html = response.data;

        const $ = load(html);

        const tableRows = $("table.wikitable tbody tr");

        const data = [];
        let lastValidValues = { gold: 0, silver: 0, bronze: 0, total: 0 };

        tableRows.each((index, element) => {
          const row = $(element);
          const rank = row.find("td:nth-child(1)").text().trim();
          const country = row.find("a:nth-child(2)").text().trim();

          let gold =
            parseInt(row.find("td:nth-child(3)").text().trim(), 10) || 0;
          let silver =
            parseInt(row.find("td:nth-child(4)").text().trim(), 10) || 0;
          let bronze =
            parseInt(row.find("td:nth-child(5)").text().trim(), 10) || 0;
          let total =
            parseInt(row.find("td:nth-child(6)").text().trim(), 10) || 0;

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
        setError(
          "App couldn't retrieve the medal data. You probably just need to refresh the page. If you refresh a few times with no improvement then everything is jacked up and you should tell Jake."
        );
      }
    };

    fetchMedalTable();
  }, []);

  const getRankedFamilyScores = () => {
    const sortedScores = Object.entries(familyScores).sort(
      (a, b) => b[1].score - a[1].score
    );

    let rank;
    let previousScore;
    let previousRank;
    return sortedScores.map(([member, details], index) => {
      if (index === 0) {
        rank = 1;
        previousRank = 1;
        previousScore = details.score;
      } else if (index !== 0 && details.score === previousScore) {
        rank = previousRank;
      } else {
        rank = index + 1;
        previousRank = rank;
      }
      previousScore = details.score;

      return {
        member,
        ...details,
        rank,
      };
    });
  };

  const rankedFamilyScores = getRankedFamilyScores();

  const draftCountries = new Set(Object.values(familyDraft).flat());

  const filteredMedalData = medalData.filter((row) =>
    draftCountries.has(row.country)
  );

  if (loading) {
    return (
      <LoadingIcon />
    );
  }
  if (error) {
    return <h1 className="text-2xl m-12">{error}</h1>;
  }

  const getRowspanCounts = (rankedScores, field) => {
    const counts = {};
    rankedScores.forEach((row, index) => {
      if (counts[row[field]]) {
        counts[row[field]] += 1;
      } else {
        counts[row[field]] = 1;
      }
    });
    return counts;
  };

  const rankRowspanCounts = getRowspanCounts(rankedFamilyScores, "rank");
  const scoreRowspanCounts = getRowspanCounts(rankedFamilyScores, "score");
  let displayedRanks = {};
  let displayedScores = {};

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
                  {displayedRanks[row.rank] ? null : (
                    <td
                      className="border px-2 md:px-4 py-2"
                      rowSpan={rankRowspanCounts[row.rank]}
                    >
                      {row.rank}
                    </td>
                  )}
                  {displayedRanks[row.rank] = true}
                  <td className="border px-2 md:px-4 py-2 flex gap-2 md:gap-4 items-center">
                    <h3 className="w-12">{row.member}</h3>
                    {row.gold > 0 && (
                      <div className="flex items-center gap-1">
                        <IconMedal className="w-6 h-6 text-[#FFD700]" />
                        {row.gold}
                      </div>
                    )}
                    {row.silver > 0 && (
                      <div className="flex items-center gap-1">
                        <IconMedal className="w-6 h-6 text-[#C0C0C0]" />
                        {row.silver}
                      </div>
                    )}
                    {row.bronze > 0 && (
                      <div className="flex items-center gap-1">
                        <IconMedal className="w-6 h-6 text-[#CD7F32]" />
                        {row.bronze}
                      </div>
                    )}
                  </td>
                  {displayedScores[row.score] ? null : (
                    <td
                      className="border px-2 md:px-4 py-2"
                      rowSpan={scoreRowspanCounts[row.score]}
                    >
                      {row.score}
                    </td>
                  )}
                  {displayedScores[row.score] = true}
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
