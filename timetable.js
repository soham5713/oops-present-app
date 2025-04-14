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
          { subject: "DECA", type: "theory" },
          { subject: "EP", type: "theory" },
        ],
        Tuesday: [
          { subject: "DECA", type: "theory" },
          { subject: "DS", type: "theory" },
        ],
        Wednesday: [
          { subject: "PSOOP", type: "lab" },
          { subject: "EP", type: "theory" },
          { subject: "IKS", type: "lab" },
          { subject: "TS", type: "theory" },
        ],
        Thursday: [
          { subject: "IKS", type: "theory" },
          { subject: "PSOOP", type: "theory" },
          { subject: "DECA", type: "theory" },
        ],
        Friday: [
          { subject: "PSOOP", type: "lab" },
          { subject: "DS", type: "theory" },
        ],
      },
      batches: {
        F1: {
          Monday: [{ subject: "DS", type: "lab" }],
          Tuesday: [{ subject: "DECA", type: "lab" }],
          Wednesday: [],
          Thursday: [{ subject: "EP", type: "lab" }],
          Friday: [{ subject: "TS", type: "lab" }],
        },
        F2: {
          Monday: [{ subject: "DS", type: "lab" }],
          Tuesday: [],
          Wednesday: [],
          Thursday: [
            { subject: "TS", type: "lab" },
            { subject: "DECA", type: "lab" },
          ],
          Friday: [{ subject: "EP", type: "lab" }],
        },
        F3: {
          Monday: [{ subject: "EP", type: "lab" }],
          Tuesday: [{ subject: "TS", type: "lab" }],
          Wednesday: [],
          Thursday: [],
          Friday: [
            { subject: "DS", type: "lab" },
            { subject: "DECA", type: "lab" },
          ],
        },
        F4: {
          Monday: [
            { subject: "TS", type: "lab" },
            { subject: "DECA", type: "lab" },
          ],
          Tuesday: [{ subject: "EP", type: "lab" }],
          Wednesday: [],
          Thursday: [],
          Friday: [{ subject: "DS", type: "lab" }],
        },
      },
    },
    G: {
      shared: {
        Monday: [
          { subject: "PSOOP", type: "theory" },
          { subject: "EC", type: "theory" },
          { subject: "DECA", type: "theory" },
          { subject: "PSOOP", type: "lab" },
        ],
        Tuesday: [
          { subject: "IKS", type: "lab" },
          { subject: "DS", type: "theory" },
        ],
        Wednesday: [
          { subject: "DECA", type: "theory" },
          { subject: "DS", type: "theory" },
        ],
        Thursday: [
          { subject: "EC", type: "theory" },
          { subject: "PSOOP", type: "lab" },
          { subject: "TS", type: "theory" },
        ],
        Friday: [
          { subject: "IKS", type: "theory" },
          { subject: "DECA", type: "theory" },
        ],
      },
      batches: {
        G1: {
          Monday: [],
          Tuesday: [{ subject: "EC", type: "lab" }],
          Wednesday: [],
          Thursday: [{ subject: "DS", type: "lab" }],
          Friday: [
            { subject: "TS", type: "lab" },
            { subject: "DECA", type: "lab" },
          ],
        },
        G2: {
          Monday: [{ subject: "DECA", type: "lab" }],
          Tuesday: [{ subject: "TS", type: "lab" }],
          Wednesday: [],
          Thursday: [{ subject: "DS", type: "lab" }],
          Friday: [{ subject: "EC", type: "lab" }],
        },
        G3: {
          Monday: [{ subject: "TS", type: "lab" }],
          Tuesday: [
            { subject: "DS", type: "lab" },
            { subject: "DECA", type: "lab" },
          ],
          Wednesday: [],
          Thursday: [{ subject: "EC", type: "lab" }],
          Friday: [],
        },
        G4: {
          Monday: [],
          Tuesday: [
            { subject: "DS", type: "lab" },
            { subject: "DECA", type: "lab" },
          ],
          Wednesday: [],
          Thursday: [{ subject: "TS", type: "lab" }],
          Friday: [{ subject: "EC", type: "lab" }],
        },
      },
    },
    H: {
      shared: {
        Monday: [
          { subject: "PSOOP", type: "theory" },
          { subject: "IKS", type: "theory" },
          { subject: "EC", type: "theory" },
        ],
        Tuesday: [
          { subject: "EC", type: "theory" },
          { subject: "IKS", type: "lab" },
          { subject: "DECA", type: "theory" },
          { subject: "DS", type: "theory" },
        ],
        Wednesday: [{ subject: "DS", type: "theory" }],
        Thursday: [
          { subject: "PSOOP", type: "lab" },
          { subject: "DECA", type: "theory" },
        ],
        Friday: [
          { subject: "DECA", type: "theory" },
          { subject: "PSOOP", type: "lab" },
          { subject: "TS", type: "theory" },
        ],
      },
      batches: {
        H1: {
          Monday: [{ subject: "DS", type: "lab" }],
          Tuesday: [{ subject: "DECA", type: "lab" }],
          Wednesday: [],
          Thursday: [{ subject: "EC", type: "lab" }],
          Friday: [{ subject: "TS", type: "lab" }],
        },
        H2: {
          Monday: [{ subject: "DS", type: "lab" }],
          Tuesday: [],
          Wednesday: [{ subject: "TS", type: "lab" }],
          Thursday: [{ subject: "DECA", type: "lab" }],
          Friday: [{ subject: "EC", type: "lab" }],
        },
        H3: {
          Monday: [{ subject: "EC", type: "lab" }],
          Tuesday: [],
          Wednesday: [
            { subject: "TS", type: "lab" },
            { subject: "DECA", type: "lab" },
          ],
          Thursday: [],
          Friday: [{ subject: "DS", type: "lab" }],
        },
        H4: {
          Monday: [
            { subject: "TS", type: "lab" },
            { subject: "DECA", type: "lab" },
          ],
          Tuesday: [],
          Wednesday: [{ subject: "EC", type: "lab" }],
          Thursday: [],
          Friday: [{ subject: "DS", type: "lab" }],
        },
      },
    },
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
  