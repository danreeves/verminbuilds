import React, { useReducer } from "react";
import { useTranslation } from "react-i18next";
import { vsprintf as format } from "format";
import styled from "styled-components";
import { Record, Set } from "immutable";
import pkg from "../package.json";
import generatedData from "./generated/data.json";

const {
  characters,
  careers,
  trees: talentTrees,
  talents,
  num_talent_rows,
  items
} = generatedData;

// TODO: This is in the wrong order because tables are unordered
// Fix at data generation level
const characterKeys = Object.keys(characters);

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
  max-width: calc(33% - 0.5rem);
  margin-bottom: 0.5rem;
  padding: 0.5rem;
`;

const Ability = styled.div`
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

function getItemsForCareerAndSlot(career, slot) {
  return Object.values(items).filter(item => {
    return item.slot_type === slot && item.can_wield.includes(career);
  });
}

function getDefaultEquipmentForCareer(career) {
  const slots = careers[career].loadout_equipment_slots.reduce(
    (slots, slot, i) => {
      slots[i] = getItemsForCareerAndSlot(career, slot)[0].item_type;
      return slots;
    },
    {}
  );
  return Equipment(slots);
}

function reducer(state, action) {
  const { type, payload } = action;
  switch (type) {
    case "character":
      return state
        .set("character", payload)
        .set("career", getDefaultCareerFromCharacter(payload)[0])
        .set(
          "equipment",
          getDefaultEquipmentForCareer(
            getDefaultCareerFromCharacter(payload)[0]
          )
        );
    case "career":
      return state
        .set("career", payload)
        .set("equipment", getDefaultEquipmentForCareer(payload));
    case "talent":
      return state.setIn(["talents", payload.row_index], payload.talent_index);
    case "equip":
      return state.setIn(["equipment", payload.slot_index], payload.item);
    default:
      throw new Error(`Action "${type}" not matched`);
  }
}

const Talents = Record(
  Array.from({ length: num_talent_rows }).reduce((o, _, i) => {
    o[i] = null;
    return o;
  }, {})
);

const Equipment = Record(
  Array.from({ length: 5 }).reduce((o, _, i) => {
    o[i] = null;
    return o;
  }, {})
);

const Build = Record({
  character: characterKeys[0],
  career: getDefaultCareerFromCharacter(characterKeys[0])[0],
  talents: Talents(),
  equipment: getDefaultEquipmentForCareer(
    getDefaultCareerFromCharacter(characterKeys[0])[0]
  ),
  name: "",
  description: "",
  tags: Set(),
  id: null,
  owner_id: null,
  game_version: "TODO", // TODO: pull game version from generatedData
  verminbuilds_version: pkg.version
});

const defaultState = Build();

function App() {
  const { t } = useTranslation();
  const [build, dispatch] = useReducer(reducer, defaultState);
  const { character, career, talents, equipment } = build;

  return (
    <Page>
      <Section>
        <Row>
          {characterKeys.map(key => {
            const char = characters[key];
            return (
              <Button
                key={key}
                onClick={() => dispatch({ type: "character", payload: key })}
                active={key === character}
              >
                {t(char.ingame_display_name)}
              </Button>
            );
          })}
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
        <Row>
          <Ability>
            <h2>Passive Ability</h2>
            <p>{t(careers[career].passive_ability.display_name)}</p>
            <p>{t(careers[career].passive_ability.description)}</p>
          </Ability>
          <Ability>
            <h2>Career Skill</h2>
            <p>{t(careers[career].activated_ability.display_name)}</p>
            <p>{t(careers[career].activated_ability.description)}</p>
          </Ability>
        </Row>
        <Row>
          <h2>Perks</h2>
        </Row>
        <Row>
          {careers[career].passive_ability.perks.map(perk => (
            <Ability key={perk.display_name}>
              <p>{t(perk.display_name)}</p>
              <p>{t(perk.description)}</p>
            </Ability>
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
                      <div>{t(talent)}</div>
                      <div>{localiseTalent(t, talent_data)}</div>
                    </Button>
                  );
                })}
              </Row>
            );
          }
        )}
      </Section>
      {careers[career].loadout_equipment_slots.map((slot, i) => {
        return (
          <div key={slot + i}>
            <select
              value={equipment.get(i)}
              onChange={e => {
                dispatch({
                  type: "equip",
                  payload: {
                    slot_index: i,
                    item: e.target.value
                  }
                });
              }}
            >
              {getItemsForCareerAndSlot(career, slot).map(item => (
                <option key={item.item_type} value={item.item_type}>
                  {t(item.item_type)}
                </option>
              ))}
            </select>
          </div>
        );
      })}
      <Section />

      <Section>
        <details>
          <pre>{JSON.stringify(build.toJS(), null, 4)}</pre>
        </details>
      </Section>
    </Page>
  );
}

export default App;
