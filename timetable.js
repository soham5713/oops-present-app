export const Timetable = {
    A: {
      shared: {
        Monday: [
          { subject: "PSOOP", type: "lab" },
          { subject: "DECA", type: "theory" },
          { subject: "UHV", type: "theory" },
          { subject: "BEE", type: "theory" },
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
          Thursday: [{ subject: "DS", type: "lab", room: "502", time: "10:45 - 12:455" }],
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

    // A: {
    //   shared: {
    //     Monday: [
    //       { subject: "FOM-II", type: "theory", room: "509", time: "09:30 - 10:30" },
    //       { subject: "MDM", type: "theory", room: "508", time: "10:45 - 11:45" },
    //       { subject: "MDM", type: "theory", room: "508", time: "11:45 - 12:45" },
    //       { subject: "CCN", type: "theory", room: "508", time: "01:45 - 02:45" },
    //       { subject: "OS", type: "theory", room: "508", time: "02:45 - 03:45" }
    //     ],
    //     Tuesday: [
    //       { subject: "FOM-II", type: "theory", room: "509", time: "09:30 - 10:30" },
    //       { subject: "SMCS", type: "theory", room: "508", time: "09:30 - 10:30" },
    //       { subject: "DAA", type: "theory", room: "508", time: "10:45 - 11:45" },
    //       { subject: "OS", type: "theory", room: "508", time: "11:45 - 12:45" },
    //       { subject: "MDM", type: "theory", room: "508", time: "04:00 - 06:00" },
    //     ],
    //     Wednesday: [
    //       { subject: "SMCS", type: "theory", room: "508", time: "10:45 - 11:45" },
    //       { subject: "PCS", type: "theory", room: "508", time: "11:45 - 12:45" },
    //       { subject: "MDM", type: "theory", room: "508", time: "04:00 - 06:00" },
    //     ],
    //     Thursday: [
    //       { subject: "FOM-II", type: "theory", room: "509", time: "09:30 - 10:30" },
    //       { subject: "CCN", type: "theory", room: "508", time: "01:45 - 02:45" },
    //       { subject: "DAA", type: "theory", room: "508", time: "02:45 - 03:45" },
    //       { subject: "HSM-II", type: "theory", room: "508", time: "04:00 - 05:00" }
    //     ],
    //     Friday: [
    //       { subject: "SMCS", type: "theory", room: "508", time: "10:45 - 11:45" },
    //       { subject: "CCN", type: "theory", room: "508", time: "11:45 - 12:45" },
    //       { subject: "OS", type: "theory", room: "508", time: "01:45 - 02:45" },
    //       { subject: "DAA", type: "theory", room: "508", time: "02:45 - 03:45" },
    //       { subject: "HSM-II", type: "theory", room: "508", time: "04:00 - 05:00" },
    //       { subject: "LLC", type: "theory", room: "508", time: "05:00 - 06:00" }
    //     ]
    //   },
    //   batches: {
    //     AA: {
    //       Monday: [{ subject: "PCS", type: "lab", room: "601", time: "04:00 - 06:00" }],
    //       Tuesday: [{ subject: "CCN", type: "lab", room: "601", time: "01:45 - 03:45" }],
    //       Wednesday: [{ subject: "OS", type: "lab", room: "608", time: "01:45 - 03:45" }],
    //       Thursday: [{ subject: "DAA", type: "lab", room: "606-4", time: "10:45 - 12:45" }],
    //     },
    //     AB: {
    //       Monday: [{ subject: "DAA", type: "lab", room: "606-4", time: "04:00 - 06:00" }],
    //       Tuesday: [{ subject: "PCS", type: "lab", room: "601", time: "01:45 - 03:45" }],
    //       Wednesday: [{ subject: "CCN", type: "lab", room: "603-3", time: "01:45 - 03:45" }],
    //       Thursday: [{ subject: "OS", type: "lab", room: "608", time: "10:45 - 12:45" }],
    //     },
    //     AC: {
    //       Monday: [{ subject: "OS", type: "lab", room: "608", time: "04:00 - 06:00" }],
    //       Tuesday: [{ subject: "DAA", type: "lab", room: "606-4", time: "01:45 - 03:45" }],
    //       Wednesday: [{ subject: "PCS", type: "lab", room: "609", time: "01:45 - 03:45" }],
    //       Thursday: [{ subject: "CCN", type: "lab", room: "603-2", time: "10:45 - 12:45" }],
    //     },
    //     AD: {
    //       Monday: [{ subject: "CCN", type: "lab", room: "603-2", time: "04:00 - 06:00" }],
    //       Tuesday: [{ subject: "OS", type: "lab", room: "608", time: "01:45 - 03:45" }],
    //       Wednesday: [{ subject: "DAA", type: "lab", room: "702-B", time: "01:45 - 03:45" }],
    //       Thursday: [{ subject: "PCS", type: "lab", room: "601", time: "10:45 - 12:45" }],
    //     }
    //   }
    // }
    
  }
  
  export const Divisions = ["A", "B", "C", "D", "E", "F", "G", "H"]

export const AllSubjects = ["DECA", "PSOOP", "BEE", "DS", "EG", "EM", "EP", "EC", "IKS", "UHV", "TS", "SS1"]

export const getDivisionTimetable = (division, batch, day) => {
  const divisionSchedule = Timetable[division]
  if (!divisionSchedule) return []

  const sharedSchedule = divisionSchedule.shared[day] || []
  const batchSchedule = divisionSchedule.batches[batch]?.[day] || []

  return [...sharedSchedule, ...batchSchedule]
}

export const getDaySubjects = (division, batch, day) => {
  const divisionSchedule = Timetable[division]
  if (!divisionSchedule) return []

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

export const hasSubject = (division, batch, subject) => {
  const divisionSchedule = Timetable[division]
  if (!divisionSchedule) return false

  const checkSchedule = (schedule) => {
    return Object.values(schedule).some((daySubjects) => daySubjects.some((item) => item.subject === subject))
  }

  return checkSchedule(divisionSchedule.shared) || checkSchedule(divisionSchedule.batches[batch])
}

export const getBatches = (division) => {
  return Object.keys(Timetable[division]?.batches || {})
}
