export const Timetable = {
  semester1: {
    A: {
      shared: {
        Monday: [
          { subject: "PSOOP", type: "lab" },
          { subject: "DECA", type: "theory" },
          { subject: "UHV", type: "theory" },
        ],
        Tuesday: [
          { subject: "PSOOP", type: "lab" },
          { subject: "BEE", type: "theory" },
        ],
        Wednesday: [
          { subject: "DECA", type: "theory" },
          { subject: "EM", type: "theory" },
        ],
        Thursday: [
          { subject: "EM", type: "theory" },
          { subject: "DECA", type: "theory" },
        ],
        Friday: [
          { subject: "UHV", type: "lab" },
          { subject: "PSOOP", type: "theory" },
          { subject: "SS1", type: "theory" },
        ],
      },
      batches: {
        A1: {
          Monday: [],
          Tuesday: [{ subject: "EM", type: "lab" }],
          Wednesday: [
            { subject: "SS1", type: "lab" },
            { subject: "BEE", type: "lab" },
          ],
          Thursday: [{ subject: "DECA", type: "lab" }],
          Friday: [],
        },
        A2: {
          Monday: [],
          Tuesday: [{ subject: "BEE", type: "lab" }],
          Wednesday: [{ subject: "DECA", type: "lab" }],
          Thursday: [{ subject: "SS1", type: "lab" }],
          Friday: [{ subject: "EM", type: "lab" }],
        },
        A3: {
          Monday: [{ subject: "DECA", type: "lab" }],
          Tuesday: [],
          Wednesday: [{ subject: "SS1", type: "lab" }],
          Thursday: [{ subject: "EM", type: "lab" }],
          Friday: [{ subject: "BEE", type: "lab" }],
        },
        A4: {
          Monday: [],
          Tuesday: [{ subject: "SS1", type: "lab" }],
          Wednesday: [{ subject: "EM", type: "lab" }],
          Thursday: [{ subject: "BEE", type: "lab" }],
          Friday: [{ subject: "DECA", type: "lab" }],
        },
      },
    },
    B: {
      shared: {
        Monday: [
          { subject: "BEE", type: "theory" },
          { subject: "UHV", type: "theory" },
        ],
        Tuesday: [
          { subject: "BEE", type: "theory" },
          { subject: "DECA", type: "theory" },
          { subject: "UHV", type: "lab" },
        ],
        Wednesday: [
          { subject: "PSOOP", type: "lab" },
          { subject: "EM", type: "theory" },
          { subject: "DECA", type: "theory" },
        ],
        Thursday: [{ subject: "PSOOP", type: "lab" }],
        Friday: [
          { subject: "PSOOP", type: "theory" },
          { subject: "DECA", type: "theory" },
          { subject: "EM", type: "theory" },
          { subject: "SS1", type: "theory" },
        ],
      },
      batches: {
        B1: {
          Monday: [{ subject: "EM", type: "lab" }],
          Tuesday: [{ subject: "BEE", type: "lab" }],
          Wednesday: [],
          Thursday: [{ subject: "DECA", type: "lab" }],
          Friday: [{ subject: "SS1", type: "lab" }],
        },
        B2: {
          Monday: [{ subject: "BEE", type: "lab" }],
          Tuesday: [{ subject: "DECA", type: "lab" }],
          Wednesday: [],
          Thursday: [{ subject: "SS1", type: "lab" }],
          Friday: [{ subject: "EM", type: "lab" }],
        },
        B3: {
          Monday: [{ subject: "DECA", type: "lab" }],
          Tuesday: [{ subject: "SS1", type: "lab" }],
          Wednesday: [],
          Thursday: [{ subject: "EM", type: "lab" }],
          Friday: [{ subject: "BEE", type: "lab" }],
        },
        B4: {
          Monday: [{ subject: "SS1", type: "lab" }],
          Tuesday: [{ subject: "EM", type: "lab" }],
          Wednesday: [],
          Thursday: [{ subject: "BEE", type: "lab" }],
          Friday: [{ subject: "DECA", type: "lab" }],
        },
      },
    },
    C: {
      shared: {
        Monday: [
          { subject: "BEE", type: "theory" },
          { subject: "DECA", type: "theory" },
          { subject: "UHV", type: "theory" },
          { subject: "PSOOP", type: "lab" },
        ],
        Tuesday: [
          { subject: "PSOOP", type: "theory" },
          { subject: "BEE", type: "theory" },
          { subject: "EG", type: "theory" },
        ],
        Wednesday: [
          { subject: "UHV", type: "lab" },
          { subject: "DECA", type: "theory" },
          { subject: "SS1", type: "theory" },
        ],
        Thursday: [],
        Friday: [
          { subject: "PSOOP", type: "lab" },
          { subject: "DECA", type: "theory" },
        ],
      },
      batches: {
        C1: {
          Monday: [],
          Tuesday: [{ subject: "EG", type: "lab" }],
          Wednesday: [{ subject: "BEE", type: "lab" }],
          Thursday: [
            { subject: "DECA", type: "lab" },
            { subject: "SS1", type: "lab" },
          ],
          Friday: [{ subject: "EG", type: "lab" }],
        },
        C2: {
          Monday: [],
          Tuesday: [{ subject: "EG", type: "lab" }],
          Wednesday: [{ subject: "SS1", type: "lab" }],
          Thursday: [
            { subject: "BEE", type: "lab" },
            { subject: "DECA", type: "lab" },
          ],
          Friday: [{ subject: "EG", type: "lab" }],
        },
        C3: {
          Monday: [],
          Tuesday: [{ subject: "BEE", type: "lab" }],
          Wednesday: [{ subject: "EG", type: "lab" }],
          Thursday: [{ subject: "EG", type: "lab" }],
          Friday: [
            { subject: "SS1", type: "lab" },
            { subject: "DECA", type: "lab" },
          ],
        },
        C4: {
          Monday: [{ subject: "DECA", type: "lab" }],
          Tuesday: [{ subject: "SS1", type: "lab" }],
          Wednesday: [{ subject: "EG", type: "lab" }],
          Thursday: [{ subject: "EG", type: "lab" }],
          Friday: [{ subject: "BEE", type: "lab" }],
        },
      },
    },
    D: {
      shared: {
        Monday: [{ subject: "BEE", type: "theory" }],
        Tuesday: [
          { subject: "PSOOP", type: "theory" },
          { subject: "PSOOP", type: "lab" },
          { subject: "BEE", type: "theory" },
        ],
        Wednesday: [
          { subject: "DECA", type: "theory" },
          { subject: "UHV", type: "theory" },
          { subject: "PSOOP", type: "lab" },
        ],
        Thursday: [
          { subject: "EG", type: "theory" },
          { subject: "SS1", type: "theory" },
          { subject: "DECA", type: "theory" },
        ],
        Friday: [
          { subject: "DECA", type: "theory" },
          { subject: "UHV", type: "lab" },
        ],
      },
      batches: {
        D1: {
          Monday: [{ subject: "EG", type: "lab" }],
          Tuesday: [],
          Wednesday: [{ subject: "BEE", type: "lab" }],
          Thursday: [{ subject: "SS1", type: "lab" }],
          Friday: [
            { subject: "DECA", type: "lab" },
            { subject: "EG", type: "lab" },
          ],
        },
        D2: {
          Monday: [{ subject: "EG", type: "lab" }],
          Tuesday: [{ subject: "DECA", type: "lab" }],
          Wednesday: [
            { subject: "SS1", type: "lab" },
            { subject: "BEE", type: "lab" },
          ],
          Thursday: [],
          Friday: [{ subject: "EG", type: "lab" }],
        },
        D3: {
          Monday: [{ subject: "BEE", type: "lab" }],
          Tuesday: [{ subject: "EG", type: "lab" }],
          Wednesday: [{ subject: "DECA", type: "lab" }],
          Thursday: [{ subject: "EG", type: "lab" }],
          Friday: [{ subject: "SS1", type: "lab" }],
        },
        D4: {
          Monday: [
            { subject: "SS1", type: "lab" },
            { subject: "BEE", type: "lab" },
          ],
          Tuesday: [{ subject: "EG", type: "lab" }],
          Wednesday: [],
          Thursday: [
            { subject: "DECA", type: "lab" },
            { subject: "EG", type: "lab" },
          ],
          Friday: [],
        },
      },
    },
    E: {
      shared: {
        Monday: [
          { subject: "PSOOP", type: "lab" },
          { subject: "DECA", type: "theory" },
          { subject: "IKS", type: "theory" },
        ],
        Tuesday: [
          { subject: "DS", type: "theory" },
          { subject: "PSOOP", type: "lab" },
          { subject: "TS", type: "theory" },
        ],
        Wednesday: [{ subject: "DECA", type: "theory" }],
        Thursday: [
          { subject: "PSOOP", type: "theory" },
          { subject: "EP", type: "theory" },
        ],
        Friday: [
          { subject: "IKS", type: "lab" },
          { subject: "DECA", type: "theory" },
          { subject: "EP", type: "theory" },
          { subject: "DS", type: "theory" },
        ],
      },
      batches: {
        E1: {
          Monday: [{ subject: "DECA", type: "lab" }],
          Tuesday: [{ subject: "EP", type: "lab" }],
          Wednesday: [{ subject: "DS", type: "lab" }],
          Thursday: [{ subject: "TS", type: "lab" }],
          Friday: [],
        },
        E2: {
          Monday: [],
          Tuesday: [{ subject: "TS", type: "lab" }],
          Wednesday: [{ subject: "DS", type: "lab" }],
          Thursday: [
            { subject: "EP", type: "lab" },
            { subject: "DECA", type: "lab" },
          ],
          Friday: [],
        },
        E3: {
          Monday: [{ subject: "EP", type: "lab" }],
          Tuesday: [{ subject: "DS", type: "lab" }],
          Wednesday: [{ subject: "TS", type: "lab" }],
          Thursday: [],
          Friday: [{ subject: "DECA", type: "lab" }],
        },
        E4: {
          Monday: [{ subject: "TS", type: "lab" }],
          Tuesday: [{ subject: "DS", type: "lab" }],
          Wednesday: [
            { subject: "DECA", type: "lab" },
            { subject: "EP", type: "lab" },
          ],
          Thursday: [],
          Friday: [],
        },
      },
    },
    F: {
      shared: {
        Monday: [
          { subject: "DECA", type: "theory", room: "108", time: "01:45 - 02:45" },
          { subject: "EP", type: "theory", room: "108", time: "02:45 - 03:45" },
        ],
        Tuesday: [
          { subject: "DECA", type: "theory", room: "305", time: "09:30 - 10:30" },
          { subject: "DS", type: "theory", room: "103", time: "10:45 - 12:45" },
        ],
        Wednesday: [
          { subject: "PSOOP", type: "lab", room: "003", time: "10:45 - 12:45" },
          { subject: "EP", type: "theory", room: "103", time: "01:45 - 02:45" },
          { subject: "IKS", type: "lab", room: "103", time: "02:45 - 03:45" },
          { subject: "TS", type: "theory", room: "003", time: "04:00 - 05:00" },
        ],
        Thursday: [
          { subject: "IKS", type: "theory", room: "103", time: "09:30 - 10:30" },
          { subject: "PSOOP", type: "theory", room: "103", time: "10:45 - 12:45" },
          { subject: "DECA", type: "theory", room: "201", time: "11:45 - 12:45" },
        ],
        Friday: [
          { subject: "PSOOP", type: "lab", room: "003", time: "10:45 - 12:45" },
          { subject: "DS", type: "theory", room: "103", time: "01:45 - 03:45" },
        ],
      },
      batches: {
        F1: {
          Monday: [{ subject: "DS", type: "lab", room: "502", time: "10:45 - 12:45" }],
          Tuesday: [{ subject: "DECA", type: "lab", room: "305", time: "01:45 - 02:45" }],
          Wednesday: [],
          Thursday: [{ subject: "EP", type: "lab", room: "107", time: "01:45 - 03:45" }],
          Friday: [{ subject: "TS", type: "lab", room: "202", time: "08:30 - 10:30" }],
        },
        F2: {
          Monday: [{ subject: "DS", type: "lab", room: "502", time: "10:45 - 12:45" }],
          Tuesday: [],
          Wednesday: [],
          Thursday: [
            { subject: "TS", type: "lab", room: "202", time: "01:45 - 03:45" },
            { subject: "DECA", type: "lab", room: "101", time: "04:00 - 05:00" },
          ],
          Friday: [{ subject: "EP", type: "lab", room: "107", time: "08:30 - 10:30" }],
        },
        F3: {
          Monday: [{ subject: "EP", type: "lab", room: "107", time: "10:45 - 12:45" }],
          Tuesday: [{ subject: "TS", type: "lab", room: "202", time: "01:45 - 03:45" }],
          Wednesday: [],
          Thursday: [],
          Friday: [
            { subject: "DS", type: "lab", room: "502", time: "08:30 - 10:30" },
            { subject: "DECA", type: "lab", room: "101", time: "04:00 - 05:00" },
          ],
        },
        F4: {
          Monday: [
            { subject: "TS", type: "lab", room: "202", time: "10:45 - 12:45" },
            { subject: "DECA", type: "lab", room: "108", time: "04:00 - 05:00" },
          ],
          Tuesday: [{ subject: "EP", type: "lab", room: "107", time: "01:45 - 03:45" }],
          Wednesday: [],
          Thursday: [],
          Friday: [{ subject: "DS", type: "lab", room: "502", time: "08:30 - 10:30" }],
        },
      },
    },
    G: {
      shared: {
        Monday: [
          { subject: "PSOOP", type: "theory", room: "103", time: "09:30 - 10:30" },
          { subject: "EC", type: "theory", room: "201", time: "10:45 - 11:45" },
          { subject: "DECA", type: "theory", room: "201", time: "11:45 - 12:45" },
          { subject: "PSOOP", type: "lab", room: "003", time: "01:45 - 03:45" },
        ],
        Tuesday: [
          { subject: "IKS", type: "lab", room: "201", time: "09:30 - 10:30" },
          { subject: "DS", type: "theory", room: "103", time: "01:45 - 03:45" },
        ],
        Wednesday: [
          { subject: "DECA", type: "theory", room: "103", time: "09:30 - 10:30" },
          { subject: "DS", type: "theory", room: "103", time: "10:45 - 12:45" },
        ],
        Thursday: [
          { subject: "EC", type: "theory", room: "305", time: "09:30 - 10:30" },
          { subject: "PSOOP", type: "lab", room: "003", time: "01:45 - 03:45" },
          { subject: "TS", type: "theory", room: "003", time: "04:00 - 05:00" },
        ],
        Friday: [
          { subject: "IKS", type: "theory", room: "108", time: "10:45 - 11:45" },
          { subject: "DECA", type: "theory", room: "108", time: "11:45 - 12:45" },
        ],
      },
      batches: {
        G1: {
          Monday: [],
          Tuesday: [{ subject: "EC", type: "lab", room: "106", time: "10:45 - 12:45" }],
          Wednesday: [],
          Thursday: [{ subject: "DS", type: "lab", room: "502", time: "10:45 - 12:45" }],
          Friday: [
            { subject: "TS", type: "lab", room: "202", time: "01:45 - 03:45" },
            { subject: "DECA", type: "lab", room: "305", time: "04:00 - 05:00" },
          ],
        },
        G2: {
          Monday: [{ subject: "DECA", type: "lab", room: "201", time: "04:00 - 05:00" }],
          Tuesday: [{ subject: "TS", type: "lab", room: "202", time: "10:45 - 12:45" }],
          Wednesday: [],
          Thursday: [{ subject: "DS", type: "lab", room: "502", time: "10:45 - 12:45" }],
          Friday: [{ subject: "EC", type: "lab", room: "106", time: "01:45 - 03:45" }],
        },
        G3: {
          Monday: [{ subject: "TS", type: "lab", room: "202", time: "04:00 - 06:00" }],
          Tuesday: [
            { subject: "DS", type: "lab", room: "502", time: "10:45 - 12:45" },
            { subject: "DECA", type: "lab", room: "201", time: "04:00 - 05:00" },
          ],
          Wednesday: [],
          Thursday: [{ subject: "EC", type: "lab", room: "106", time: "10:45 - 12:45" }],
          Friday: [],
        },
        G4: {
          Monday: [],
          Tuesday: [
            { subject: "DS", type: "lab", room: "502", time: "10:45 - 12:45" },
            { subject: "DECA", type: "lab", room: "101", time: "04:00 - 05:00" },
          ],
          Wednesday: [],
          Thursday: [{ subject: "TS", type: "lab", room: "202", time: "10:45 - 12:45" }],
          Friday: [{ subject: "EC", type: "lab", room: "106", time: "08:30 - 10:30" }],
        },
      },
    },
    H: {
      shared: {
        Monday: [
          { subject: "PSOOP", type: "theory", room: "103", time: "09:30 - 10:30" },
          { subject: "IKS", type: "theory", room: "305", time: "10:45 - 11:45" },
          { subject: "EC", type: "theory", room: "305", time: "11:45 - 12:45" },
        ],
        Tuesday: [
          { subject: "EC", type: "theory", room: "101", time: "09:30 - 10:30" },
          { subject: "IKS", type: "lab", room: "101", time: "10:45 - 11:45" },
          { subject: "DECA", type: "theory", room: "101", time: "11:45 - 12:45" },
          { subject: "DS", type: "theory", room: "103", time: "01:45 - 03:45" },
        ],
        Wednesday: [{ subject: "DS", type: "theory", room: "103", time: "10:45 - 12:45" }],
        Thursday: [
          { subject: "PSOOP", type: "lab", room: "003", time: "10:45 - 12:45" },
          { subject: "DECA", type: "theory", room: "108", time: "01:45 - 02:45" },
        ],
        Friday: [
          { subject: "DECA", type: "theory", room: "305", time: "09:30 - 10:30" },
          { subject: "PSOOP", type: "lab", room: "003", time: "01:45 - 03:45" },
          { subject: "TS", type: "theory", room: "003", time: "04:00 - 05:00" },
        ],
      },
      batches: {
        H1: {
          Monday: [{ subject: "DS", type: "lab", room: "502", time: "01:45 - 03:45" }],
          Tuesday: [{ subject: "DECA", type: "lab", room: "305", time: "04:00 - 05:00" }],
          Wednesday: [],
          Thursday: [{ subject: "EC", type: "lab", room: "106", time: "02:45 - 04:45" }],
          Friday: [{ subject: "TS", type: "lab", room: "202", time: "10:45 - 12:45" }],
        },
        H2: {
          Monday: [{ subject: "DS", type: "lab", room: "502", time: "01:45 - 03:45" }],
          Tuesday: [],
          Wednesday: [{ subject: "TS", type: "lab", room: "202", time: "01:45 - 03:45" }],
          Thursday: [{ subject: "DECA", type: "lab", room: "108", time: "02:45 - 03:45" }],
          Friday: [{ subject: "EC", type: "lab", room: "106", time: "10:45 - 12:45" }],
        },
        H3: {
          Monday: [{ subject: "EC", type: "lab", room: "106", time: "01:45 - 03:45" }],
          Tuesday: [],
          Wednesday: [
            { subject: "TS", type: "lab", room: "202", time: "08:30 - 10:30" },
            { subject: "DECA", type: "lab", room: "305", time: "01:45 - 02:45" },
          ],
          Thursday: [],
          Friday: [{ subject: "DS", type: "lab", room: "502", time: "10:45 - 12:45" }],
        },
        H4: {
          Monday: [
            { subject: "TS", type: "lab", room: "202", time: "01:45 - 03:45" },
            { subject: "DECA", type: "lab", room: "101", time: "04:00 - 05:00" },
          ],
          Tuesday: [],
          Wednesday: [{ subject: "EC", type: "lab", room: "106", time: "08:30 - 10:30" }],
          Thursday: [],
          Friday: [{ subject: "DS", type: "lab", room: "502", time: "10:45 - 12:45" }],
        },
      },
    },
  },
  semester2: {
    A: {
      shared: {
        Monday: [
          { subject: "FOM-II", type: "theory", room: "509", time: "09:30 - 10:30" },
          { subject: "MDM", type: "theory", room: "508", time: "10:45 - 11:45" },
          { subject: "MDM", type: "theory", room: "508", time: "11:45 - 12:45" },
          { subject: "CCN", type: "theory", room: "508", time: "01:45 - 02:45" },
          { subject: "OS", type: "theory", room: "508", time: "02:45 - 03:45" },
        ],
        Tuesday: [
          { subject: "FOM-II", type: "theory", room: "509", time: "09:30 - 10:30" },
          { subject: "SMCS", type: "theory", room: "508", time: "09:30 - 10:30" },
          { subject: "DAA", type: "theory", room: "508", time: "10:45 - 11:45" },
          { subject: "OS", type: "theory", room: "508", time: "11:45 - 12:45" },
          { subject: "MDM", type: "theory", room: "508", time: "04:00 - 06:00" },
        ],
        Wednesday: [
          { subject: "SMCS", type: "theory", room: "508", time: "10:45 - 11:45" },
          { subject: "PCS", type: "theory", room: "508", time: "11:45 - 12:45" },
          { subject: "MDM", type: "theory", room: "508", time: "04:00 - 06:00" },
        ],
        Thursday: [
          { subject: "FOM-II", type: "theory", room: "509", time: "09:30 - 10:30" },
          { subject: "CCN", type: "theory", room: "508", time: "01:45 - 02:45" },
          { subject: "DAA", type: "theory", room: "508", time: "02:45 - 03:45" },
          { subject: "HSM-II", type: "theory", room: "508", time: "04:00 - 05:00" },
        ],
        Friday: [
          { subject: "SMCS", type: "theory", room: "508", time: "10:45 - 11:45" },
          { subject: "CCN", type: "theory", room: "508", time: "11:45 - 12:45" },
          { subject: "OS", type: "theory", room: "508", time: "01:45 - 02:45" },
          { subject: "DAA", type: "theory", room: "508", time: "02:45 - 03:45" },
          { subject: "HSM-II", type: "theory", room: "508", time: "04:00 - 05:00" },
          { subject: "LLC", type: "theory", room: "508", time: "05:00 - 06:00" },
        ],
      },
      batches: {
        A1: {
          // Changed from AA to A1
          Monday: [{ subject: "PCS", type: "lab", room: "601", time: "04:00 - 06:00" }],
          Tuesday: [{ subject: "CCN", type: "lab", room: "601", time: "01:45 - 03:45" }],
          Wednesday: [{ subject: "OS", type: "lab", room: "608", time: "01:45 - 03:45" }],
          Thursday: [{ subject: "DAA", type: "lab", room: "606-4", time: "10:45 - 12:45" }],
        },
        A2: {
          // Changed from AB to A2
          Monday: [{ subject: "DAA", type: "lab", room: "606-4", time: "04:00 - 06:00" }],
          Tuesday: [{ subject: "PCS", type: "lab", room: "601", time: "01:45 - 03:45" }],
          Wednesday: [{ subject: "CCN", type: "lab", room: "603-3", time: "01:45 - 03:45" }],
          Thursday: [{ subject: "OS", type: "lab", room: "608", time: "10:45 - 12:45" }],
        },
        A3: {
          Monday: [{ subject: "OS", type: "lab", room: "608", time: "04:00 - 06:00" }],
          Tuesday: [{ subject: "DAA", type: "lab", room: "606-4", time: "01:45 - 03:45" }],
          Wednesday: [{ subject: "PCS", type: "lab", room: "609", time: "01:45 - 03:45" }],
          Thursday: [{ subject: "CCN", type: "lab", room: "603-2", time: "10:45 - 12:45" }],
        },
        A4: {
          // Changed from AD to A4
          Monday: [{ subject: "CCN", type: "lab", room: "603-2", time: "04:00 - 06:00" }],
          Tuesday: [{ subject: "OS", type: "lab", room: "608", time: "01:45 - 03:45" }],
          Wednesday: [{ subject: "DAA", type: "lab", room: "702-B", time: "01:45 - 03:45" }],
          Thursday: [{ subject: "PCS", type: "lab", room: "601", time: "10:45 - 12:45" }],
        },
      },
    },
    B: {
      shared: {
        Monday: [
          { subject: "FOM-II", type: "theory", room: "509", time: "09:30 - 10:30" },
          { subject: "MDM", type: "theory", room: "508", time: "10:45 - 11:45" },
        ],
        Tuesday: [
          { subject: "CCN", type: "theory", room: "508", time: "09:30 - 10:30" },
          { subject: "OS", type: "theory", room: "508", time: "10:45 - 11:45" },
        ],
        Wednesday: [
          { subject: "DAA", type: "theory", room: "508", time: "09:30 - 10:30" },
          { subject: "SMCS", type: "theory", room: "508", time: "10:45 - 11:45" },
        ],
        Thursday: [
          { subject: "PCS", type: "theory", room: "508", time: "09:30 - 10:30" },
          { subject: "HSM-II", type: "theory", room: "508", time: "10:45 - 11:45" },
        ],
        Friday: [
          { subject: "LLC", type: "theory", room: "508", time: "09:30 - 10:30" },
          { subject: "MDM", type: "theory", room: "508", time: "10:45 - 11:45" },
        ],
      },
      batches: {
        B1: {
          Monday: [{ subject: "OS", type: "lab", room: "608", time: "01:45 - 03:45" }],
          Tuesday: [{ subject: "CCN", type: "lab", room: "603-2", time: "01:45 - 03:45" }],
          Wednesday: [{ subject: "DAA", type: "lab", room: "606-4", time: "01:45 - 03:45" }],
          Thursday: [{ subject: "PCS", type: "lab", room: "601", time: "01:45 - 03:45" }],
          Friday: [],
        },
        B2: {
          // Changed from BB to B2
          Monday: [{ subject: "CCN", type: "lab", room: "603-2", time: "01:45 - 03:45" }],
          Tuesday: [{ subject: "DAA", type: "lab", room: "606-4", time: "01:45 - 03:45" }],
          Wednesday: [{ subject: "PCS", type: "lab", room: "601", time: "01:45 - 03:45" }],
          Thursday: [{ subject: "OS", type: "lab", room: "608", time: "01:45 - 03:45" }],
          Friday: [],
        },
        B3: {
          // Changed from BC to B3
          Monday: [{ subject: "DAA", type: "lab", room: "606-4", time: "01:45 - 03:45" }],
          Tuesday: [{ subject: "PCS", type: "lab", room: "601", time: "01:45 - 03:45" }],
          Wednesday: [{ subject: "OS", type: "lab", room: "608", time: "01:45 - 03:45" }],
          Thursday: [{ subject: "CCN", type: "lab", room: "603-2", time: "01:45 - 03:45" }],
          Friday: [],
        },
        B4: {
          // Changed from BD to B4
          Monday: [{ subject: "PCS", type: "lab", room: "601", time: "01:45 - 03:45" }],
          Tuesday: [{ subject: "OS", type: "lab", room: "608", time: "01:45 - 03:45" }],
          Wednesday: [{ subject: "CCN", type: "lab", room: "603-2", time: "01:45 - 03:45" }],
          Thursday: [{ subject: "DAA", type: "lab", room: "606-4", time: "01:45 - 03:45" }],
          Friday: [],
        },
      },
    },
    C: {
      shared: {
        Monday: [
          { subject: "FOM-II", type: "theory", room: "509", time: "09:30 - 10:30" },
          { subject: "CCN", type: "theory", room: "508", time: "10:45 - 11:45" },
        ],
        Tuesday: [
          { subject: "OS", type: "theory", room: "508", time: "09:30 - 10:30" },
          { subject: "DAA", type: "theory", room: "508", time: "10:45 - 11:45" },
        ],
        Wednesday: [
          { subject: "MDM", type: "theory", room: "508", time: "09:30 - 10:30" },
          { subject: "SMCS", type: "theory", room: "508", time: "10:45 - 11:45" },
        ],
        Thursday: [
          { subject: "PCS", type: "theory", room: "508", time: "09:30 - 10:30" },
          { subject: "HSM-II", type: "theory", room: "508", time: "10:45 - 11:45" },
        ],
        Friday: [{ subject: "LLC", type: "theory", room: "508", time: "09:30 - 10:30" }],
      },
      batches: {
        C1: {
          // Changed from CA to C1
          Monday: [{ subject: "DAA", type: "lab", room: "606-4", time: "01:45 - 03:45" }],
          Tuesday: [{ subject: "OS", type: "lab", room: "608", time: "01:45 - 03:45" }],
          Wednesday: [{ subject: "CCN", type: "lab", room: "603-2", time: "01:45 - 03:45" }],
          Thursday: [{ subject: "PCS", type: "lab", room: "601", time: "01:45 - 03:45" }],
          Friday: [],
        },
        C2: {
          // Changed from CB to C2
          Monday: [{ subject: "OS", type: "lab", room: "608", time: "01:45 - 03:45" }],
          Tuesday: [{ subject: "CCN", type: "lab", room: "603-2", time: "01:45 - 03:45" }],
          Wednesday: [{ subject: "PCS", type: "lab", room: "601", time: "01:45 - 03:45" }],
          Thursday: [{ subject: "DAA", type: "lab", room: "606-4", time: "01:45 - 03:45" }],
          Friday: [],
        },
        C3: {
          // Changed from CC to C3
          Monday: [{ subject: "CCN", type: "lab", room: "603-2", time: "01:45 - 03:45" }],
          Tuesday: [{ subject: "PCS", type: "lab", room: "601", time: "01:45 - 03:45" }],
          Wednesday: [{ subject: "DAA", type: "lab", room: "606-4", time: "01:45 - 03:45" }],
          Thursday: [{ subject: "OS", type: "lab", room: "608", time: "01:45 - 03:45" }],
          Friday: [],
        },
        C4: {
          // Changed from CD to C4
          Monday: [{ subject: "PCS", type: "lab", room: "601", time: "01:45 - 03:45" }],
          Tuesday: [{ subject: "DAA", type: "lab", room: "606-4", time: "01:45 - 03:45" }],
          Wednesday: [{ subject: "OS", type: "lab", room: "608", time: "01:45 - 03:45" }],
          Thursday: [{ subject: "CCN", type: "lab", room: "603-2", time: "01:45 - 03:45" }],
          Friday: [],
        },
      },
    },
    D: {
      shared: {
        Monday: [
          { subject: "MDM", type: "theory", room: "508", time: "09:30 - 10:30" },
          { subject: "OS", type: "theory", room: "508", time: "10:45 - 11:45" },
        ],
        Tuesday: [
          { subject: "FOM-II", type: "theory", room: "509", time: "09:30 - 10:30" },
          { subject: "CCN", type: "theory", room: "508", time: "10:45 - 11:45" },
        ],
        Wednesday: [
          { subject: "DAA", type: "theory", room: "508", time: "09:30 - 10:30" },
          { subject: "SMCS", type: "theory", room: "508", time: "10:45 - 11:45" },
        ],
        Thursday: [
          { subject: "PCS", type: "theory", room: "508", time: "09:30 - 10:30" },
          { subject: "HSM-II", type: "theory", room: "508", time: "10:45 - 11:45" },
        ],
        Friday: [
          { subject: "LLC", type: "theory", room: "508", time: "09:30 - 10:30" },
          { subject: "MDM", type: "theory", room: "508", time: "10:45 - 11:45" },
        ],
      },
      batches: {
        D1: {
          // Changed from DA to D1
          Monday: [{ subject: "CCN", type: "lab", room: "603-2", time: "01:45 - 03:45" }],
          Tuesday: [{ subject: "DAA", type: "lab", room: "606-4", time: "01:45 - 03:45" }],
          Wednesday: [{ subject: "OS", type: "lab", room: "608", time: "01:45 - 03:45" }],
          Thursday: [{ subject: "PCS", type: "lab", room: "601", time: "01:45 - 03:45" }],
          Friday: [],
        },
        D2: {
          // Changed from DB to D2
          Monday: [{ subject: "DAA", type: "lab", room: "606-4", time: "01:45 - 03:45" }],
          Tuesday: [{ subject: "OS", type: "lab", room: "608", time: "01:45 - 03:45" }],
          Wednesday: [{ subject: "PCS", type: "lab", room: "601", time: "01:45 - 03:45" }],
          Thursday: [{ subject: "CCN", type: "lab", room: "603-2", time: "01:45 - 03:45" }],
          Friday: [],
        },
        D3: {
          // Changed from DC to D3
          Monday: [{ subject: "OS", type: "lab", room: "608", time: "01:45 - 03:45" }],
          Tuesday: [{ subject: "PCS", type: "lab", room: "601", time: "01:45 - 03:45" }],
          Wednesday: [{ subject: "CCN", type: "lab", room: "603-2", time: "01:45 - 03:45" }],
          Thursday: [{ subject: "DAA", type: "lab", room: "606-4", time: "01:45 - 03:45" }],
          Friday: [],
        },
        D4: {
          // Changed from DD to D4
          Monday: [{ subject: "PCS", type: "lab", room: "601", time: "01:45 - 03:45" }],
          Tuesday: [{ subject: "CCN", type: "lab", room: "603-2", time: "01:45 - 03:45" }],
          Wednesday: [{ subject: "DAA", type: "lab", room: "606-4", time: "01:45 - 03:45" }],
          Thursday: [{ subject: "OS", type: "lab", room: "608", time: "01:45 - 03:45" }],
          Friday: [],
        },
      },
    },
    E: {
      shared: {
        Monday: [
          { subject: "FOM-II", type: "theory", room: "509", time: "09:30 - 10:30" },
          { subject: "DAA", type: "theory", room: "508", time: "10:45 - 11:45" },
        ],
        Tuesday: [
          { subject: "CCN", type: "theory", room: "508", time: "09:30 - 10:30" },
          { subject: "MDM", type: "theory", room: "508", time: "10:45 - 11:45" },
        ],
        Wednesday: [
          { subject: "OS", type: "theory", room: "508", time: "09:30 - 10:30" },
          { subject: "SMCS", type: "theory", room: "508", time: "10:45 - 11:45" },
        ],
        Thursday: [
          { subject: "PCS", type: "theory", room: "508", time: "09:30 - 10:30" },
          { subject: "HSM-II", type: "theory", room: "508", time: "10:45 - 11:45" },
        ],
        Friday: [{ subject: "LLC", type: "theory", room: "508", time: "09:30 - 10:30" }],
      },
      batches: {
        E1: {
          // Changed from EA to E1
          Monday: [{ subject: "OS", type: "lab", room: "608", time: "01:45 - 03:45" }],
          Tuesday: [{ subject: "CCN", type: "lab", room: "603-2", time: "01:45 - 03:45" }],
          Wednesday: [{ subject: "DAA", type: "lab", room: "606-4", time: "01:45 - 03:45" }],
          Thursday: [{ subject: "PCS", type: "lab", room: "601", time: "01:45 - 03:45" }],
          Friday: [],
        },
        E2: {
          // Changed from EB to E2
          Monday: [{ subject: "CCN", type: "lab", room: "603-2", time: "01:45 - 03:45" }],
          Tuesday: [{ subject: "DAA", type: "lab", room: "606-4", time: "01:45 - 03:45" }],
          Wednesday: [{ subject: "PCS", type: "lab", room: "601", time: "01:45 - 03:45" }],
          Thursday: [{ subject: "OS", type: "lab", room: "608", time: "01:45 - 03:45" }],
          Friday: [],
        },
        E3: {
          // Changed from EC to E3
          Monday: [{ subject: "DAA", type: "lab", room: "606-4", time: "01:45 - 03:45" }],
          Tuesday: [{ subject: "PCS", type: "lab", room: "601", time: "01:45 - 03:45" }],
          Wednesday: [{ subject: "OS", type: "lab", room: "608", time: "01:45 - 03:45" }],
          Thursday: [{ subject: "CCN", type: "lab", room: "603-2", time: "01:45 - 03:45" }],
          Friday: [],
        },
        E4: {
          // Changed from ED to E4
          Monday: [{ subject: "PCS", type: "lab", room: "601", time: "01:45 - 03:45" }],
          Tuesday: [{ subject: "OS", type: "lab", room: "608", time: "01:45 - 03:45" }],
          Wednesday: [{ subject: "CCN", type: "lab", room: "603-2", time: "01:45 - 03:45" }],
          Thursday: [{ subject: "DAA", type: "lab", room: "606-4", time: "01:45 - 03:45" }],
          Friday: [],
        },
      },
    },
    F: {
      shared: {
        Monday: [
          { subject: "MDM", type: "theory", room: "508", time: "09:30 - 10:30" },
          { subject: "CCN", type: "theory", room: "508", time: "10:45 - 11:45" },
        ],
        Tuesday: [
          { subject: "FOM-II", type: "theory", room: "509", time: "09:30 - 10:30" },
          { subject: "OS", type: "theory", room: "508", time: "10:45 - 11:45" },
        ],
        Wednesday: [
          { subject: "DAA", type: "theory", room: "508", time: "09:30 - 10:30" },
          { subject: "SMCS", type: "theory", room: "508", time: "10:45 - 11:45" },
        ],
        Thursday: [
          { subject: "PCS", type: "theory", room: "508", time: "09:30 - 10:30" },
          { subject: "HSM-II", type: "theory", room: "508", time: "10:45 - 11:45" },
        ],
        Friday: [
          { subject: "LLC", type: "theory", room: "508", time: "09:30 - 10:30" },
          { subject: "MDM", type: "theory", room: "508", time: "10:45 - 11:45" },
        ],
      },
      batches: {
        F1: {
          // Changed from FA to F1
          Monday: [{ subject: "DAA", type: "lab", room: "606-4", time: "01:45 - 03:45" }],
          Tuesday: [{ subject: "CCN", type: "lab", room: "603-2", time: "01:45 - 03:45" }],
          Wednesday: [{ subject: "OS", type: "lab", room: "608", time: "01:45 - 03:45" }],
          Thursday: [{ subject: "PCS", type: "lab", room: "601", time: "01:45 - 03:45" }],
          Friday: [],
        },
        F2: {
          // Changed from FB to F2
          Monday: [{ subject: "CCN", type: "lab", room: "603-2", time: "01:45 - 03:45" }],
          Tuesday: [{ subject: "OS", type: "lab", room: "608", time: "01:45 - 03:45" }],
          Wednesday: [{ subject: "PCS", type: "lab", room: "601", time: "01:45 - 03:45" }],
          Thursday: [{ subject: "DAA", type: "lab", room: "606-4", time: "01:45 - 03:45" }],
          Friday: [],
        },
        F3: {
          // Changed from FC to F3
          Monday: [{ subject: "OS", type: "lab", room: "608", time: "01:45 - 03:45" }],
          Tuesday: [{ subject: "PCS", type: "lab", room: "601", time: "01:45 - 03:45" }],
          Wednesday: [{ subject: "DAA", type: "lab", room: "606-4", time: "01:45 - 03:45" }],
          Thursday: [{ subject: "CCN", type: "lab", room: "603-2", time: "01:45 - 03:45" }],
          Friday: [],
        },
        F4: {
          // Changed from FD to F4
          Monday: [{ subject: "PCS", type: "lab", room: "601", time: "01:45 - 03:45" }],
          Tuesday: [{ subject: "DAA", type: "lab", room: "606-4", time: "01:45 - 03:45" }],
          Wednesday: [{ subject: "CCN", type: "lab", room: "603-2", time: "01:45 - 03:45" }],
          Thursday: [{ subject: "OS", type: "lab", room: "608", time: "01:45 - 03:45" }],
          Friday: [],
        },
      },
    },
    G: {
      shared: {
        Monday: [
          { subject: "FOM-II", type: "theory", room: "509", time: "09:30 - 10:30" },
          { subject: "OS", type: "theory", room: "508", time: "10:45 - 11:45" },
        ],
        Tuesday: [
          { subject: "CCN", type: "theory", room: "508", time: "09:30 - 10:30" },
          { subject: "DAA", type: "theory", room: "508", time: "10:45 - 11:45" },
        ],
        Wednesday: [
          { subject: "MDM", type: "theory", room: "508", time: "09:30 - 10:30" },
          { subject: "SMCS", type: "theory", room: "508", time: "10:45 - 11:45" },
        ],
        Thursday: [
          { subject: "PCS", type: "theory", room: "508", time: "09:30 - 10:30" },
          { subject: "HSM-II", type: "theory", room: "508", time: "10:45 - 11:45" },
        ],
        Friday: [{ subject: "LLC", type: "theory", room: "508", time: "09:30 - 10:30" }],
      },
      batches: {
        G1: {
          // Changed from GA to G1
          Monday: [{ subject: "CCN", type: "lab", room: "603-2", time: "01:45 - 03:45" }],
          Tuesday: [{ subject: "OS", type: "lab", room: "608", time: "01:45 - 03:45" }],
          Wednesday: [{ subject: "DAA", type: "lab", room: "606-4", time: "01:45 - 03:45" }],
          Thursday: [{ subject: "PCS", type: "lab", room: "601", time: "01:45 - 03:45" }],
          Friday: [],
        },
        G2: {
          // Changed from GB to G2
          Monday: [{ subject: "OS", type: "lab", room: "608", time: "01:45 - 03:45" }],
          Tuesday: [{ subject: "DAA", type: "lab", room: "606-4", time: "01:45 - 03:45" }],
          Wednesday: [{ subject: "PCS", type: "lab", room: "601", time: "01:45 - 03:45" }],
          Thursday: [{ subject: "CCN", type: "lab", room: "603-2", time: "01:45 - 03:45" }],
          Friday: [],
        },
        G3: {
          // Changed from GC to G3
          Monday: [{ subject: "DAA", type: "lab", room: "606-4", time: "01:45 - 03:45" }],
          Tuesday: [{ subject: "PCS", type: "lab", room: "601", time: "01:45 - 03:45" }],
          Wednesday: [{ subject: "CCN", type: "lab", room: "603-2", time: "01:45 - 03:45" }],
          Thursday: [{ subject: "OS", type: "lab", room: "608", time: "01:45 - 03:45" }],
          Friday: [],
        },
        G4: {
          // Changed from GD to G4
          Monday: [{ subject: "PCS", type: "lab", room: "601", time: "01:45 - 03:45" }],
          Tuesday: [{ subject: "CCN", type: "lab", room: "603-2", time: "01:45 - 03:45" }],
          Wednesday: [{ subject: "OS", type: "lab", room: "608", time: "01:45 - 03:45" }],
          Thursday: [{ subject: "DAA", type: "lab", room: "606-4", time: "01:45 - 03:45" }],
          Friday: [],
        },
      },
    },
    H: {
      shared: {
        Monday: [
          { subject: "MDM", type: "theory", room: "508", time: "09:30 - 10:30" },
          { subject: "DAA", type: "theory", room: "508", time: "10:45 - 11:45" },
        ],
        Tuesday: [
          { subject: "FOM-II", type: "theory", room: "509", time: "09:30 - 10:30" },
          { subject: "CCN", type: "theory", room: "508", time: "10:45 - 11:45" },
        ],
        Wednesday: [
          { subject: "OS", type: "theory", room: "508", time: "09:30 - 10:30" },
          { subject: "SMCS", type: "theory", room: "508", time: "10:45 - 11:45" },
        ],
        Thursday: [
          { subject: "PCS", type: "theory", room: "508", time: "09:30 - 10:30" },
          { subject: "HSM-II", type: "theory", room: "508", time: "10:45 - 11:45" },
        ],
        Friday: [
          { subject: "LLC", type: "theory", room: "508", time: "09:30 - 10:30" },
          { subject: "MDM", type: "theory", room: "508", time: "10:45 - 11:45" },
        ],
      },
      batches: {
        H1: {
          // Changed from HA to H1
          Monday: [{ subject: "OS", type: "lab", room: "608", time: "01:45 - 03:45" }],
          Tuesday: [{ subject: "DAA", type: "lab", room: "606-4", time: "01:45 - 03:45" }],
          Wednesday: [{ subject: "CCN", type: "lab", room: "603-2", time: "01:45 - 03:45" }],
          Thursday: [{ subject: "PCS", type: "lab", room: "601", time: "01:45 - 03:45" }],
          Friday: [],
        },
        H2: {
          // Changed from HB to H2
          Monday: [{ subject: "DAA", type: "lab", room: "606-4", time: "01:45 - 03:45" }],
          Tuesday: [{ subject: "CCN", type: "lab", room: "603-2", time: "01:45 - 03:45" }],
          Wednesday: [{ subject: "PCS", type: "lab", room: "601", time: "01:45 - 03:45" }],
          Thursday: [{ subject: "OS", type: "lab", room: "608", time: "01:45 - 03:45" }],
          Friday: [],
        },
        H3: {
          // Changed from HC to H3
          Monday: [{ subject: "CCN", type: "lab", room: "603-2", time: "01:45 - 03:45" }],
          Tuesday: [{ subject: "PCS", type: "lab", room: "601", time: "01:45 - 03:45" }],
          Wednesday: [{ subject: "OS", type: "lab", room: "608", time: "01:45 - 03:45" }],
          Thursday: [{ subject: "DAA", type: "lab", room: "606-4", time: "01:45 - 03:45" }],
          Friday: [],
        },
        H4: {
          // Changed from HD to H4
          Monday: [{ subject: "PCS", type: "lab", room: "601", time: "01:45 - 03:45" }],
          Tuesday: [{ subject: "OS", type: "lab", room: "608", time: "01:45 - 03:45" }],
          Wednesday: [{ subject: "DAA", type: "lab", room: "606-4", time: "01:45 - 03:45" }],
          Thursday: [{ subject: "CCN", type: "lab", room: "603-2", time: "01:45 - 03:45" }],
          Friday: [],
        },
      },
    },
  },
  semester3: {
    CSE_A: {
      shared: {
        Monday: [
          { subject: "PCS", type: "theory", room: "408", time: "10:00 - 11:00" },
          { subject: "DSGT", type: "theory", room: "408", time: "11:00 - 12:00" },
          { subject: "DBMS", type: "theory", room: "408", time: "12:00 - 01:00" },
          { subject: "BSES", type: "theory", room: "", time: "02:00 - 03:00" },
          { subject: "BSES", type: "lab", room: "", time: "03:00 - 05:00" },
        ],
        Tuesday: [
          { subject: "DS", type: "theory", room: "008", time: "11:00 - 12:00" },
          { subject: "COA", type: "theory", room: "408", time: "12:00 - 01:00" },
          { subject: "BSES", type: "theory", room: "", time: "02:00 - 03:00" },
          { subject: "BSES", type: "lab", room: "", time: "03:00 - 05:00" },
          { subject: "DSGT", type: "theory", room: "408", time: "03:00 - 04:00" },
        ],
        Wednesday: [
          { subject: "COA", type: "theory", room: "408", time: "12:00 - 01:00" },
          { subject: "DBMS", type: "theory", room: "408", time: "02:00 - 03:00" },
          { subject: "BSES", type: "theory", room: "", time: "03:00 - 04:00" },
          { subject: "BSES", type: "lab", room: "", time: "03:00 - 05:00" },
          { subject: "LLC", type: "theory", room: "", time: "05:00 - 06:00" },
        ],
        Thursday: [
          { subject: "COA", type: "theory", room: "408", time: "12:00 - 01:00" },
          { subject: "BSES", type: "lab", room: "", time: "02:00 - 04:00" },
          { subject: "HSM-1", type: "theory", room: "", time: "04:00 - 05:00" },
        ],
        Friday: [
          { subject: "DS", type: "theory", room: "408", time: "09:00 - 10:00" },
          { subject: "DSGT", type: "theory", room: "408", time: "12:00 - 01:00" },
          { subject: "DBMS", type: "theory", room: "408", time: "02:00 - 03:00" },
          { subject: "HSM-1", type: "theory", room: "", time: "04:00 - 05:00" },
        ],
      },
      batches: {
        A1: {
          // Changed from CSE_A1 to A1
          Tuesday: [{ subject: "PCS", type: "lab", room: "405", time: "09:00 - 11:00" }],
          Wednesday: [{ subject: "DBMS", type: "lab", room: "410A", time: "10:00 - 12:00" }],
          Thursday: [{ subject: "COA", type: "lab", room: "406B", time: "10:00 - 12:00" }],
          Friday: [{ subject: "DS", type: "lab", room: "408", time: "10:00 - 12:00" }],
        },
        A2: {
          // Changed from CSE_A2 to A2
          Monday: [{ subject: "DS", type: "lab", room: "408", time: "03:00 - 05:00" }],
          Wednesday: [{ subject: "PCS", type: "lab", room: "405", time: "10:00 - 12:00" }],
          Thursday: [{ subject: "DBMS", type: "lab", room: "410B", time: "10:00 - 12:00" }],
          Friday: [{ subject: "COA", type: "lab", room: "406B", time: "10:00 - 12:00" }],
        },
        A3: {
          // Changed from CSE_A3 to A3
          Tuesday: [{ subject: "COA", type: "lab", room: "404", time: "09:00 - 11:00" }],
          Wednesday: [{ subject: "DS", type: "lab", room: "404", time: "10:00 - 12:00" }],
          Thursday: [{ subject: "PCS", type: "lab", room: "407", time: "09:00 - 11:00" }],
          Friday: [{ subject: "DBMS", type: "lab", room: "410B", time: "10:00 - 12:00" }],
        },
        A4: {
          // Changed from CSE_A4 to A4
          Tuesday: [{ subject: "DBMS", type: "lab", room: "410A", time: "09:00 - 11:00" }],
          Wednesday: [{ subject: "COA", type: "lab", room: "406A", time: "10:00 - 12:00" }],
          Thursday: [{ subject: "DS", type: "lab", room: "404", time: "10:00 - 12:00" }],
          Friday: [{ subject: "PCS", type: "lab", room: "405", time: "10:00 - 12:00" }],
        },
      },
    },
    CSE_B: {
      shared: {
        Monday: [
          { subject: "PCS", type: "theory", room: "408", time: "10:00 - 11:00" },
          { subject: "DSGT", type: "theory", room: "408", time: "11:00 - 12:00" },
          { subject: "DBMS", type: "theory", room: "408", time: "12:00 - 01:00" },
          { subject: "BSES", type: "theory", room: "", time: "02:00 - 03:00" },
          { subject: "BSES", type: "lab", room: "", time: "03:00 - 05:00" },
        ],
        Tuesday: [
          { subject: "DS", type: "theory", room: "008", time: "11:00 - 12:00" },
          { subject: "COA", type: "theory", room: "408", time: "12:00 - 01:00" },
          { subject: "BSES", type: "theory", room: "", time: "02:00 - 03:00" },
          { subject: "BSES", type: "lab", room: "", time: "03:00 - 05:00" },
          { subject: "DSGT", type: "theory", room: "408", time: "03:00 - 04:00" },
        ],
        Wednesday: [
          { subject: "DBMS", type: "theory", room: "408", time: "08:00 - 09:00" },
          { subject: "DS", type: "theory", room: "408", time: "09:00 - 10:00" },
          { subject: "COA", type: "theory", room: "408", time: "12:00 - 01:00" },
          { subject: "DBMS", type: "theory", room: "408", time: "02:00 - 03:00" },
          { subject: "BSES", type: "theory", room: "", time: "03:00 - 04:00" },
          { subject: "BSES", type: "lab", room: "", time: "03:00 - 05:00" },
          { subject: "LLC", type: "theory", room: "", time: "05:00 - 06:00" },
        ],
        Thursday: [
          { subject: "COA", type: "theory", room: "408", time: "12:00 - 01:00" },
          { subject: "BSES", type: "lab", room: "", time: "02:00 - 04:00" },
          { subject: "HSM-1", type: "theory", room: "", time: "04:00 - 05:00" },
        ],
        Friday: [
          { subject: "DS", type: "theory", room: "408", time: "09:00 - 10:00" },
          { subject: "DSGT", type: "theory", room: "408", time: "12:00 - 01:00" },
          { subject: "HSM-1", type: "theory", room: "", time: "04:00 - 05:00" },
        ],
      },
      batches: {
        B1: {
          // Changed from CSE_B1 to B1
          Tuesday: [{ subject: "DS", type: "lab", room: "406A", time: "09:00 - 11:00" }],
          Wednesday: [{ subject: "PCS", type: "lab", room: "407", time: "10:00 - 12:00" }],
          Thursday: [{ subject: "DBMS", type: "lab", room: "410A", time: "10:00 - 12:00" }],
          Friday: [{ subject: "COA", type: "lab", room: "406A", time: "10:00 - 12:00" }],
        },
        B2: {
          // Changed from CSE_B2 to B2
          Tuesday: [{ subject: "COA", type: "lab", room: "406B", time: "09:00 - 11:00" }],
          Wednesday: [{ subject: "DS", type: "lab", room: "404", time: "10:00 - 12:00" }],
          Thursday: [{ subject: "PCS", type: "lab", room: "407", time: "09:00 - 11:00" }],
          Friday: [{ subject: "DBMS", type: "lab", room: "410A", time: "10:00 - 12:00" }],
        },
        B3: {
          // Changed from CSE_B3 to B3
          Tuesday: [{ subject: "DBMS", type: "lab", room: "410B", time: "09:00 - 11:00" }],
          Wednesday: [{ subject: "COA", type: "lab", room: "406B", time: "10:00 - 12:00" }],
          Friday: [{ subject: "PCS", type: "lab", room: "407", time: "10:00 - 12:00" }],
        },
        B4: {
          // Changed from CSE_B4 to B4
          Tuesday: [{ subject: "PCS", type: "lab", room: "404", time: "09:00 - 11:00" }],
          Wednesday: [{ subject: "DBMS", type: "lab", room: "410B", time: "10:00 - 12:00" }],
          Thursday: [{ subject: "COA", type: "lab", room: "406A", time: "10:00 - 12:00" }],
          Friday: [{ subject: "DS", type: "lab", room: "404", time: "10:00 - 12:00" }],
        },
      },
    },
    EXTC_A: {
      // New division for semesters 3-8
      shared: {},
      batches: {
        A1: {},
        A2: {},
        A3: {},
        A4: {},
      },
    },
    EXTC_B: {
      // New division for semesters 3-8
      shared: {},
      batches: {
        B1: {},
        B2: {},
        B3: {},
        B4: {},
      },
    },
    CE_A: {
      // New division for semesters 3-8
      shared: {},
      batches: {
        A1: {},
        A2: {},
        A3: {},
        A4: {},
      },
    },
    CE_B: {
      // New division for semesters 3-8
      shared: {},
      batches: {
        B1: {},
        B2: {},
        B3: {},
        B4: {},
      },
    },
    CE_C: {
      // New division for semesters 3-8
      shared: {},
      batches: {
        C1: {},
        C2: {},
        C3: {},
        C4: {},
      },
    },
    CE_D: {
      // New division for semesters 3-8
      shared: {},
      batches: {
        D1: {},
        D2: {},
        D3: {},
        D4: {},
      },
    },
  },
  semester4: {
    // Placeholder for semester 4
    CSE_A: {
      shared: {},
      batches: { A1: {}, A2: {}, A3: {}, A4: {} },
    },
    CSE_B: {
      shared: {},
      batches: { B1: {}, B2: {}, B3: {}, B4: {} },
    },
    EXTC_A: {
      shared: {},
      batches: { A1: {}, A2: {}, A3: {}, A4: {} },
    },
    EXTC_B: {
      shared: {},
      batches: { B1: {}, B2: {}, B3: {}, B4: {} },
    },
    CE_A: {
      shared: {},
      batches: { A1: {}, A2: {}, A3: {}, A4: {} },
    },
    CE_B: {
      shared: {},
      batches: { B1: {}, B2: {}, B3: {}, B4: {} },
    },
    CE_C: {
      shared: {},
      batches: { C1: {}, C2: {}, C3: {}, C4: {} },
    },
    CE_D: {
      shared: {},
      batches: { D1: {}, D2: {}, D3: {}, D4: {} },
    },
  },
  semester5: {
    // Placeholder for semester 5
    CSE_A: {
      shared: {},
      batches: { A1: {}, A2: {}, A3: {}, A4: {} },
    },
    CSE_B: {
      shared: {},
      batches: { B1: {}, B2: {}, B3: {}, B4: {} },
    },
    EXTC_A: {
      shared: {},
      batches: { A1: {}, A2: {}, A3: {}, A4: {} },
    },
    EXTC_B: {
      shared: {},
      batches: { B1: {}, B2: {}, B3: {}, B4: {} },
    },
    CE_A: {
      shared: {},
      batches: { A1: {}, A2: {}, A3: {}, A4: {} },
    },
    CE_B: {
      shared: {},
      batches: { B1: {}, B2: {}, B3: {}, B4: {} },
    },
    CE_C: {
      shared: {},
      batches: { C1: {}, C2: {}, C3: {}, C4: {} },
    },
    CE_D: {
      shared: {},
      batches: { D1: {}, D2: {}, D3: {}, D4: {} },
    },
  },
  semester6: {
    // Placeholder for semester 6
    CSE_A: {
      shared: {},
      batches: { A1: {}, A2: {}, A3: {}, A4: {} },
    },
    CSE_B: {
      shared: {},
      batches: { B1: {}, B2: {}, B3: {}, B4: {} },
    },
    EXTC_A: {
      shared: {},
      batches: { A1: {}, A2: {}, A3: {}, A4: {} },
    },
    EXTC_B: {
      shared: {},
      batches: { B1: {}, B2: {}, B3: {}, B4: {} },
    },
    CE_A: {
      shared: {},
      batches: { A1: {}, A2: {}, A3: {}, A4: {} },
    },
    CE_B: {
      shared: {},
      batches: { B1: {}, B2: {}, B3: {}, B4: {} },
    },
    CE_C: {
      shared: {},
      batches: { C1: {}, C2: {}, C3: {}, C4: {} },
    },
    CE_D: {
      shared: {},
      batches: { D1: {}, D2: {}, D3: {}, D4: {} },
    },
  },
  semester7: {
    // Placeholder for semester 7
    CSE_A: {
      shared: {},
      batches: { A1: {}, A2: {}, A3: {}, A4: {} },
    },
    CSE_B: {
      shared: {},
      batches: { B1: {}, B2: {}, B3: {}, B4: {} },
    },
    EXTC_A: {
      shared: {},
      batches: { A1: {}, A2: {}, A3: {}, A4: {} },
    },
    EXTC_B: {
      shared: {},
      batches: { B1: {}, B2: {}, B3: {}, B4: {} },
    },
    CE_A: {
      shared: {},
      batches: { A1: {}, A2: {}, A3: {}, A4: {} },
    },
    CE_B: {
      shared: {},
      batches: { B1: {}, B2: {}, B3: {}, B4: {} },
    },
    CE_C: {
      shared: {},
      batches: { C1: {}, C2: {}, C3: {}, C4: {} },
    },
    CE_D: {
      shared: {},
      batches: { D1: {}, D2: {}, D3: {}, D4: {} },
    },
  },
  semester8: {
    // Placeholder for semester 8
    CSE_A: {
      shared: {},
      batches: { A1: {}, A2: {}, A3: {}, A4: {} },
    },
    CSE_B: {
      shared: {},
      batches: { B1: {}, B2: {}, B3: {}, B4: {} },
    },
    EXTC_A: {
      shared: {},
      batches: { A1: {}, A2: {}, A3: {}, A4: {} },
    },
    EXTC_B: {
      shared: {},
      batches: { B1: {}, B2: {}, B3: {}, B4: {} },
    },
    CE_A: {
      shared: {},
      batches: { A1: {}, A2: {}, A3: {}, A4: {} },
    },
    CE_B: {
      shared: {},
      batches: { B1: {}, B2: {}, B3: {}, B4: {} },
    },
    CE_C: {
      shared: {},
      batches: { C1: {}, C2: {}, C3: {}, C4: {} },
    },
    CE_D: {
      shared: {},
      batches: { D1: {}, D2: {}, D3: {}, D4: {} },
    },
  },
}

// Divisions are now dynamically determined by semester
export const Divisions = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "CSE_A",
  "CSE_B",
  "EXTC_A",
  "EXTC_B",
  "CE_A",
  "CE_B",
  "CE_C",
  "CE_D",
]

// Updated subject lists for different semesters
export const SubjectsBySemester = {
  semester1: ["DECA", "PSOOP", "BEE", "DS", "EG", "EM", "EP", "EC", "IKS", "UHV", "TS", "SS1"],
  semester2: ["FOM-II", "MDM", "CCN", "OS", "DAA", "SMCS", "PCS", "HSM-II", "LLC"],
  semester3: ["PCS", "DSGT", "DBMS", "BSES", "DS", "COA", "LLC", "HSM-1"],
  semester4: ["CN", "TOC", "AI", "ML", "WEB", "MOBILE", "CLOUD"],
  semester5: ["COMPILER", "GRAPHICS", "SECURITY", "IOT", "BLOCKCHAIN"],
  semester6: ["PROJECT-I", "INTERNSHIP", "RESEARCH", "ELECTIVE-I"],
  semester7: ["PROJECT-II", "ADVANCED-AI", "QUANTUM", "ELECTIVE-II"],
  semester8: ["THESIS", "CAPSTONE", "INDUSTRY", "ELECTIVE-III"],
}

// Fallback to semester1 subjects if semester not found
export const AllSubjects = SubjectsBySemester.semester1

export const getDivisionTimetable = (division, batch, day, semester = "1") => {
  const semesterKey = `semester${semester}`
  const semesterData = Timetable[semesterKey]

  if (!semesterData || !semesterData[division]) {
    console.warn(`No timetable found for semester ${semester}, division ${division}`)
    return []
  }

  const divisionSchedule = semesterData[division]
  const sharedSchedule = divisionSchedule.shared[day] || []
  const batchSchedule = divisionSchedule.batches[batch]?.[day] || []

  return [...sharedSchedule, ...batchSchedule]
}

export const getDaySubjects = (division, batch, day, semester = "1") => {
  const semesterKey = `semester${semester}`
  const semesterData = Timetable[semesterKey]

  if (!semesterData || !semesterData[division]) {
    console.warn(`No timetable found for semester ${semester}, division ${division}`)
    return []
  }

  const divisionSchedule = semesterData[division]
  const sharedSchedule = divisionSchedule.shared[day] || []
  const batchSchedule = divisionSchedule.batches[batch]?.[day] || []

  // Combine shared and batch schedules, preserving both theory and lab
  const combinedSchedule = [...sharedSchedule]
  batchSchedule.forEach((batchSubject) => {
    const existingSubject = combinedSchedule.find((s) => s.subject === batchSubject.subject)
    if (existingSubject) {
      existingSubject.type = Array.isArray(existingSubject.type)
        ? [...new Set([...existingSubject.type, batchSubject.type])]
        : [existingSubject.type, batchSubject.type]
    } else {
      combinedSchedule.push({ ...batchSubject, type: [batchSubject.type] })
    }
  })

  return combinedSchedule.map((subject) => ({
    ...subject,
    type: Array.isArray(subject.type) ? subject.type : [subject.type],
  }))
}

export const hasSubject = (division, batch, subject, semester = "1") => {
  const semesterKey = `semester${semester}`
  const semesterData = Timetable[semesterKey]

  if (!semesterData || !semesterData[division]) {
    return false
  }

  const divisionSchedule = semesterData[division]

  const checkSchedule = (schedule) => {
    return Object.values(schedule).some((daySubjects) => daySubjects.some((item) => item.subject === subject))
  }

  return checkSchedule(divisionSchedule.shared) || checkSchedule(divisionSchedule.batches[batch])
}

export const getBatches = (division, semester = "1") => {
  const semesterKey = `semester${semester}`
  const semesterData = Timetable[semesterKey]

  if (!semesterData || !semesterData[division]) {
    return []
  }

  return Object.keys(semesterData[division]?.batches || {})
}

export const getSubjectsForSemester = (semester = "1") => {
  const semesterKey = `semester${semester}`
  return SubjectsBySemester[semesterKey] || SubjectsBySemester.semester1
}

export const getSemesterTimetable = (semester = "1") => {
  const semesterKey = `semester${semester}`
  return Timetable[semesterKey] || Timetable.semester1
}
