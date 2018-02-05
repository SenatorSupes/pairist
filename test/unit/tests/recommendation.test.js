import Recommendation from "@/lib/recommendation"
import assert from "assert"
import _ from "lodash"

describe("Recommendation", () => {
  let recommendation

  beforeEach(() => {
    recommendation = new Recommendation({
      historyChunkDuration: 1000,
    })
  })

  describe("_isPairingValid", () => {
    it("is always valid without solos", () => {
      expect(recommendation._isPairingValid({ pairing: [], solos: [] })).toBeTruthy()
    })

    it("is invalid if pairing two solos but not together", () => {
      expect(recommendation._isPairingValid({
        pairing: [[1, 3], [2, 4]],
        solos: [{ ".key": 1 }, { ".key": 2 }],
      })).toBeTruthy()
    })

    it("is invalid if pairing two solos together", () => {
      expect(recommendation._isPairingValid({
        pairing: [[1, 2]],
        solos: [{ ".key": 1 }, { ".key": 2 }],
      })).toBeFalsy()
    })
  })

  describe("findBestPairing", () => {
    it("does not blow up if history is not set", () => {
      const bestPairing = recommendation.findBestPairing({
        current: {
          people: [ { ".key": "p1", "location": "l1" } ],
          lanes: [{ ".key": "l1" }],
        },
      })

      expect(bestPairing).toEqual([
        {
          lane: "l1",
          pair: [
            {".key": "p1", "location": "l1"},
            undefined,
          ],
        },
      ])
    })

    it("returns the single possibility if there's only one", () => {
      const bestPairing = recommendation.findBestPairing({
        current: {
          people: [
            { ".key": "p1", "location": "l1" },
            { ".key": "p2", "location": "l1" },
          ],
          lanes: [{ ".key": "l1" }],
        },
        history: [],
      })

      expect(bestPairing).toEqual([
        {
          lane: "l1",
          pair: [
            {".key": "p1", "location": "l1"},
            {".key": "p2", "location": "l1"},
          ],
        },
      ])
    })

    describe("with 3 people", () => {
      it("pairs the two that haven't paired together the longest", () => {
        const bestPairing = recommendation.findBestPairing({
          current: {
            people: [
              { ".key": "p1", "location": "unassigned" },
              { ".key": "p2", "location": "unassigned" },
              { ".key": "p3", "location": "unassigned" },
            ],
            lanes: [{ ".key": "l1" }],
          },
          history: [
            {
              ".key": "" + previousScore(recommendation, 2),
              "people": [
                { ".key": "p1", "location": "l1" },
                { ".key": "p2", "location": "l2" },
                { ".key": "p3", "location": "l1" },
              ],
            },
            {
              ".key": "" + previousScore(recommendation, 1),
              "people": [
                { ".key": "p1", "location": "l1" },
                { ".key": "p2", "location": "l1" },
                { ".key": "p3", "location": "l2" },
              ],
            },
          ],
        })

        expect(bestPairing).toEqual([
          {
            lane: "l1",
            pair: [
              {".key": "p1", "location": "unassigned"},
              undefined,
            ],
          },
          {
            lane: "new-lane",
            pair: [
              {".key": "p2", "location": "unassigned"},
              {".key": "p3", "location": "unassigned"},
            ],
          },
        ])
      })
    })

    describe("with people out", () => {
      it("pairs the two that haven't paired together the longest", () => {
        const bestPairing = recommendation.findBestPairing({
          current: {
            people: [
              { ".key": "p1", "location": "unassigned" },
              { ".key": "p2", "location": "unassigned" },
              { ".key": "p3", "location": "out" },
            ],
            lanes: [],
          },
          history: [
            {
              ".key": "" + previousScore(recommendation, 1),
              "people": [
                { ".key": "p1", "location": "l1" },
                { ".key": "p2", "location": "l1" },
                { ".key": "p3", "location": "l2" },
              ],
            },
            {
              ".key": "" + previousScore(recommendation, 2),
              "people": [
                { ".key": "p1", "location": "l1" },
                { ".key": "p2", "location": "l2" },
                { ".key": "p3", "location": "l1" },
              ],
            },
          ],
        })

        expect(bestPairing).toEqual([
          {
            lane: "new-lane",
            pair: [
              {".key": "p1", "location": "unassigned"},
              {".key": "p2", "location": "unassigned"},
            ],
          },
        ])
      })
    })

    describe("fuzz", () => {
      for (let i = 0; i < 200; i++) {
        it(`fuzz #${i}`, () => {
          const peopleCount = randomInt(10)
          const outCount = randomInt(4)
          const lanesCount = randomInt(5)
          const historyCount = randomInt(200)
          const historyChunkDuration = randomInt(1000000)
          const config = {
            peopleCount,
            outCount,
            lanesCount,
            historyCount,
            historyChunkDuration,
          }
          const board = generateBoard(config)

          const bestPairing = recommendation.findBestPairing(board)
          if (lanesCount*2-1 > peopleCount || peopleCount === 0) {
            // too many lanes
            assert.equal(bestPairing, undefined, JSON.stringify({config, current: board.current}))
          } else {
            assert.ok(bestPairing, JSON.stringify({config, current: board.current}))
            expect(bestPairing.length).toBeGreaterThanOrEqual(1)
          }
        })
      }
    })
  })

  describe("scaleDate", () => {
    it("converts milliseconds to the specified history chunk", () => {
      expect(recommendation.scaleDate(1000)).toEqual(1)
    })

    it("rounds decimals (down)", () => {
      expect(recommendation.scaleDate(1400)).toEqual(1)
    })

    it("rounds decimals (up)", () => {
      expect(recommendation.scaleDate(1500)).toEqual(2)
    })

    it("works with other numbers", () => {
      expect(recommendation.scaleDate(3721931)).toEqual(3722)
    })

    it("converts date objets to time if not already a number", () => {
      const date = new Date("December 18, 1992 18:30:00")
      expect(recommendation.scaleDate(date.getTime())).toEqual(724732200)
      expect(recommendation.scaleDate(date)).toEqual(724732200)
    })
  })
})

const guid = () => {
  const s4 = () => {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1)
  }
  return s4() + s4() + "-" + s4() + "-" + s4() + "-" +
    s4() + "-" + s4() + s4() + s4()
}

const generateBoard = ({
  peopleCount,
  outCount,
  lanesCount,
  historyCount,
  historyChunkDuration,
}) => {
  let board = {
    current: {
      people: [],
      lanes: [],
    },
    history: [],
  }

  let locations = ["unassigned"]
  for (let i = 0; i < lanesCount; i++) {
    const id = guid()
    locations.push(id)
    board.current.lanes.push({ ".key": id })
  }

  let people = []
  for (let i = 0; i < peopleCount; i++) {
    people.push(guid())
  }

  for (let i = 0; i < outCount; i++) {
    people.push(guid())
  }

  const generateAssignment = (people, locations) => {
    let assignment = []
    people = _.shuffle(people)
    for (let i = 0; i < people.length - outCount; i++) {
      let location = locations[randomInt(locations.length)]

      assignment.push({
        ".key": people[i],
        "location": location,
      })
    }

    for (let i = 0; i < outCount; i++) {
      assignment.push({
        ".key": people[people.length - outCount + i],
        "location": "out",
      })
    }

    return assignment
  }

  board.current.people = generateAssignment(people, locations)

  for (let i = 0; i < historyCount; i++) {
    board.history.push({
      ".key": ""+ 1000000 - i*historyChunkDuration,
      "people": generateAssignment(people, locations),
    })
  }

  return board
}

const  previousScore = (recommendation, timeAgo) => {
  return recommendation.scaleDate(new Date() - timeAgo*recommendation.historyChunkDuration)
}

const randomInt = (max) => {
  return Math.floor(Math.random() * Math.floor(max))
}
