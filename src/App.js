import React, { useReducer } from "react";
import { useTranslation } from "react-i18next";
import { vsprintf as format } from "format";
import styled from "styled-components";
import { Record, Map } from "immutable";
import generatedData from "./generated/data.json";

// TODO: rename these keys in the generated data
const { characters: careers, trees: talentTrees, talents } = generatedData;

// TODO: This ordered list should come from the generated data
const characters = [
  "empire_soldier",
  "dwarf_ranger",
  "wood_elf",
  "witch_hunter",
  "bright_wizard"
];

const Page = styled.div`
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
`;

const Section = styled.div`
  margin-bottom: 1rem;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
`;

const Button = styled.button`
  ${({ active }) => active && `color: red`}
  flex-grow: 1;
  flex-basis: 0;
`;

function getCareersFromCharacter(character) {
  return Object.entries(careers)
    .filter(([key]) => key !== "empire_soldier_tutorial")
    .filter(([_, char]) => char.profile_name === character)
    .sort((a, b) => (a[1].sort_order > b[1].sort_order ? 1 : -1));
}

function getDefaultCareerFromCharacter(character) {
  const careers = getCareersFromCharacter(character);
  return careers[0];
}

function getTalentTreeFromCareer(character, career) {
  return talentTrees[character][career.talent_tree_index - 1];
}

function getTalent(character, name) {
  return talents[character].find(talent => talent.name === name);
}

function localiseTalent(t, talent_data) {
  let values = null;
  if (Array.isArray(talent_data.description_values)) {
    values = talent_data.description_values.map(val => {
      const { value, value_type } = val;
      switch (value_type) {
        case "percent":
          return Math.abs(value * -100);
        case "baked_percent":
          return value * 100 - 100;
        default:
          return value;
      }
    });
  }
  let description = t(talent_data.description);
  if (talent_data.description === "bardin_ranger_reduced_spread_desc") {
    // wat
    description = description.replace("%1.f", "%.1f");
  }
  // Fix rendering inconsistency: we don't want floating points
  description = description.replace("%.1f", "%d");
  return format(description, values);
}

function reducer(state, action) {
  const { type, payload } = action;
  switch (type) {
    case "character":
      return state
        .set("character", payload)
        .set("career", getDefaultCareerFromCharacter(payload)[0]);
    case "career":
      return state.set("career", payload);
    case "talent":
      return state.setIn(["talents", payload.row_index], payload.talent_index);
    default:
      throw new Error(`Action "${type}" not matched`);
  }
}

const Build = Record({
  character: characters[0],
  career: getDefaultCareerFromCharacter(characters[0])[0],
  talents: Map()
});

const defaultState = Build();

function App() {
  const { t } = useTranslation();
  const [build, dispatch] = useReducer(reducer, defaultState);
  const { character, career, talents } = build;

  return (
    <Page>
      <Section>
        <Row>
          {characters.map(key => (
            <Button
              key={key}
              onClick={() => dispatch({ type: "character", payload: key })}
              active={key === character}
            >
              {t(key)}
            </Button>
          ))}
        </Row>
      </Section>

      <Section>
        <Row>
          {getCareersFromCharacter(character).map(([key, career_data]) => (
            <Button
              key={key}
              onClick={() => dispatch({ type: "career", payload: key })}
              active={key === career}
            >
              {t(career_data.display_name)}
            </Button>
          ))}
        </Row>
      </Section>

      <Section>
        {getTalentTreeFromCareer(character, careers[career]).map(
          (row, row_index) => {
            return (
              <Row key={row_index}>
                {row.map((talent, talent_index) => {
                  const talent_data = getTalent(character, talent);
                  return (
                    <Button
                      key={`${row_index}${talent_index}`}
                      active={talents.get(row_index) === talent_index}
                      onClick={() =>
                        dispatch({
                          type: "talent",
                          payload: {
                            row_index,
                            talent_index
                          }
                        })
                      }
                    >
                      {t(talent)}
                      {localiseTalent(t, talent_data)}
                    </Button>
                  );
                })}
              </Row>
            );
          }
        )}
      </Section>
    </Page>
  );
}

export default App;
