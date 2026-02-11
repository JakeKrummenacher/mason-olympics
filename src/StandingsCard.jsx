import React, { useEffect, useState } from "react";
import axios from "axios";
import { load } from "cheerio";
import IconMedal from "./IconMedal";
import LoadingIcon from "./LoadingIcon";
import "flag-icons/css/flag-icons.min.css";
import { getCode } from "iso-3166-1-alpha-2";

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

const normalizeCountryName = (name) => {
  if (!name) return "";
  const n = name.trim();
  const aliases = {
    "Great Britain": "United Kingdom",
    "South Korea": "Korea, Republic of",
    // add more aliases here if needed
  };
  return aliases[n] ?? n;
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
    return <LoadingIcon />;
  }
  if (error) {
    return <h1 className="text-2xl m-12">{error}</h1>;
  }

  const renderCountryChip = (country, index) => {
    if (country === "Individual Neutral Athletes") {
      return (
        <span
          key={index}
          className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-2 py-1 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-700 shadow-sm"
          aria-label="Individual Neutral Athletes (INA)"
        >
          INA
        </span>
      );
    }

    const normalized = normalizeCountryName(country);
    const code = normalized ? getCode(normalized) : null;

    return (
      <span
        key={index}
        className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-2 py-1 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-700 shadow-sm"
      >
        {code ? (
          <span
            className={`fi fi-${String(code).toLowerCase()} w-5 h-3 rounded-sm flex-shrink-0`}
            aria-hidden="true"
          />
        ) : (
          <span className="text-xs text-gray-500">—</span>
        )}
        <span className="truncate max-w-[9rem] sm:max-w-[12rem]">{country}</span>
      </span>
    );
  };

  return (
    <div className="min-h-screen w-full p-4 md:p-8 bg-slate-50">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Family Draft Scores - responsive cards */}
        <div className="bg-white shadow-md rounded-lg p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold mb-4">
            Family Draft Scores
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {rankedFamilyScores.map((row, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 border rounded-md bg-white"
              >
                <div className="flex items-center">
                  <div className="text-lg text-gray-500 w-8 text-center">
                    {row.rank}
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-800">
                      {row.member}
                    </div>
                  </div>
                </div>

                {/* Prominent medal counts + big score */}
                <div className="flex items-center gap-6 sm:mt-0">
                  <div className="flex items-center gap-2">
                    <IconMedal className="w-6 h-6 text-[#FFD700]" />
                    <div className="text-lg font-semibold text-gray-800">
                      {row.gold}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconMedal className="w-6 h-6 text-[#C0C0C0]" />
                    <div className="text-lg font-semibold text-gray-800">
                      {row.silver}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconMedal className="w-6 h-6 text-[#CD7F32]" />
                    <div className="text-lg font-semibold text-gray-800">
                      {row.bronze}
                    </div>
                  </div>
                  <div className="ml-2 text-right">
                    <div className="text-xs text-gray-500">Score</div>
                    <div className="text-2xl font-extrabold text-indigo-700 leading-tight">
                      {row.score}
                    </div>
                  </div>
                </div>

                {/* Secondary chips: placed after medals/score */}
                <div className="w-full sm:w-auto flex flex-wrap items-center gap-2 sm:mt-0 justify-start sm:justify-end opacity-80">
                  {familyDraft[row.member].map((country, i) =>
                    renderCountryChip(country, i)
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Standings for drafted countries */}
        <div className="bg-white shadow-md rounded-lg p-4 md:p-6 overflow-x-auto">
          <h2 className="text-lg md:text-xl font-semibold mb-4">
            Standings for Drafted Countries
          </h2>
          <table className="min-w-full table-auto">
            <thead>
              <tr className="text-left text-sm text-gray-600">
                <th className="px-3 py-2">Country</th>
                <th className="px-3 py-2">Gold</th>
                <th className="px-3 py-2">Silver</th>
                <th className="px-3 py-2">Bronze</th>
                <th className="px-3 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredMedalData.map((row, index) => {
                const normalized = normalizeCountryName(row.country);
                const code = normalized ? getCode(normalized) : null;
                return (
                  <tr
                    key={index}
                    className="border-b last:border-b-0 hover:bg-slate-50"
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="font-medium truncate max-w-[12rem]">
                          {row.country}
                        </div>
                        {row.country === "Individual Neutral Athletes" ? (
                          <span className="inline-flex items-center bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-medium">
                            INA
                          </span>
                        ) : code ? (
                          <span
                            className={`fi fi-${String(code).toLowerCase()} w-6 h-4 inline-block`}
                            aria-hidden="true"
                          />
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-3">{row.gold}</td>
                    <td className="px-3 py-3">{row.silver}</td>
                    <td className="px-3 py-3">{row.bronze}</td>
                    <td className="px-3 py-3">{row.total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MedalTable;
