import { create } from "zustand";
import {
    persist,
    createJSONStorage,
    subscribeWithSelector,
    StorageValue,
} from "zustand/middleware";

export const weekdays = [
    "SUN",
    "MON",
    "TUE",
    "WED",
    "THU",
    "FRI",
    "SAT",
] as const;
export type WeekDay = (typeof weekdays)[number];

export const weekdayToString = (day: WeekDay): string => {
    switch (day) {
        case "MON":
            return "Monday";
        case "TUE":
            return "Tuesday";
        case "WED":
            return "Wednesday";
        case "THU":
            return "Thursday";
        case "FRI":
            return "Friday";
        case "SAT":
            return "Saturday";
        case "SUN":
            return "Sunday";
        default:
            return "Error";
    }
};

const API_ENDPOINT = "/schedule";
const API_PORT = "8080";
const API_URL = "http://localhost";

export type ShiftType = "FIRST_HALF" | "SECOND_HALF";

export const shiftToString = (shift: ShiftType | Set<ShiftType>): string => {
    if (!(shift instanceof Set)) {
        if (shift === "FIRST_HALF") return "First Half";
        else return "Second Half";
    } else if (shift instanceof Set) {
        if (shift.has("FIRST_HALF") && shift.has("SECOND_HALF")) {
            return "All-day";
        } else if (shift.has("FIRST_HALF")) {
            return "First Half";
        } else if (shift.has("SECOND_HALF")) {
            return "Second Half";
        } else {
            return "None";
        }
    } else {
        return "Error";
    }
};

interface OrderedSet<T> extends Array<T> {
    add: (item: T) => boolean;
    remove: (item: T | number) => T;
}

export type Operator = {
    name: string;
    qualifications: Set<string>;
    schedule: Set<WeekDay>;
    shift: Set<ShiftType>;
    canFloat?: boolean;
    isSupervisor?: boolean;
    daysInCharge: Set<WeekDay>;
};

export type Bench = {
    name: string;
    daysPresent: Set<WeekDay>;
    daysRequired: Set<WeekDay>;
};

interface BenchNamesState {
    names: Bench[];
    addName: (name: string) => any;
    removeName: (name: string) => any;
    setName: (name: string, newName: string) => any;
    //toggleBenchRequired: (name: string, day: WeekDay) => any;
    addDaysRequired: (name: string, days: WeekDay[]) => any;
    removeDaysRequired: (name: string, days: WeekDay[]) => any;
    setDaysRequired: (name: string, days: WeekDay[]) => any;

    addDaysPresent: (name: string, days: WeekDay[]) => any;
    removeDaysPresent: (name: string, days: WeekDay[]) => any;
    setDaysPresent: (name: string, days: WeekDay[]) => any;
}

export const useBenchNamesStore = create<BenchNamesState>()(
    persist(
        (set) => ({
            names: [],
            addName: (name: string) =>
                set((state) => {
                    if (
                        !state.names.find((n) => n.name === name) &&
                        name != ""
                    ) {
                        const newArr = [
                            ...state.names,
                            {
                                name,
                                daysRequired: new Set<WeekDay>([]),
                                daysPresent: new Set<WeekDay>([
                                    "MON",
                                    "TUE",
                                    "WED",
                                    "THU",
                                    "FRI",
                                    "SAT",
                                    "SUN",
                                ]),
                            },
                        ];
                        newArr.sort((a, b) => {
                            if (a.name < b.name) {
                                return -1;
                            } else if (b.name < a.name) {
                                return 1;
                            } else return 0;
                        });
                        return {
                            names: newArr,
                        };
                    } else {
                        return {
                            names: [...state.names],
                        };
                    }
                }),
            removeName: (name: string) =>
                set((state) => {
                    return {
                        names: state.names.filter((n) => n.name !== name),
                    };
                }),
            setName: (name: string, newName: string) =>
                set((state) => {
                    const theBench = state.names.find((n) => n.name == name);
                    if (theBench) {
                        theBench.name = newName;
                    }
                    return { names: [...state.names] };
                }),
            addDaysRequired: (name: string, days: WeekDay[]) =>
                set((state) => {
                    const theBench = state.names.find((n) => n.name == name);
                    if (theBench) {
                        days.forEach((d) => {
                            theBench.daysPresent.add(d);
                            theBench.daysRequired.add(d);
                        });
                    }
                    return { names: [...state.names] };
                }),
            removeDaysRequired: (name: string, days: WeekDay[]) =>
                set((state) => {
                    const theBench = state.names.find((n) => n.name == name);
                    if (theBench) {
                        days.forEach((d) => theBench.daysRequired.delete(d));
                    }
                    return { names: [...state.names] };
                }),
            setDaysRequired: (name: string, days: WeekDay[]) =>
                set((state) => {
                    const theBench = state.names.find((n) => n.name == name);
                    if (theBench) {
                        theBench.daysRequired = new Set(days);
                        days.forEach((d) => theBench.daysPresent.add(d));
                    }
                    return { names: [...state.names] };
                }),
            addDaysPresent: (name: string, days: WeekDay[]) =>
                set((state) => {
                    const theBench = state.names.find((n) => n.name == name);
                    if (theBench) {
                        days.forEach((d) => theBench.daysPresent.add(d));
                    }
                    return { names: [...state.names] };
                }),
            removeDaysPresent: (name: string, days: WeekDay[]) =>
                set((state) => {
                    const theBench = state.names.find((n) => n.name == name);
                    if (theBench) {
                        days.forEach((d) => {
                            theBench.daysPresent.delete(d);
                            theBench.daysRequired.delete(d);
                        });
                    }
                    return { names: [...state.names] };
                }),
            setDaysPresent: (name: string, days: WeekDay[]) =>
                set((state) => {
                    const theBench = state.names.find((n) => n.name == name);
                    if (theBench) {
                        theBench.daysPresent = new Set(days);
                        theBench.daysRequired = new Set(
                            Array.from(theBench.daysRequired).filter((val) =>
                                theBench.daysPresent.has(val)
                            )
                        );
                    }
                    return { names: [...state.names] };
                }),
        }),
        {
            name: "bench-names-storage",
            storage: {
                getItem: (name) => {
                    const str = localStorage.getItem(name);
                    if (!str) return null;
                    const existingValue = JSON.parse(str);
                    return {
                        ...existingValue,
                        state: {
                            ...existingValue.state,
                            names: existingValue.state.names.map(
                                (name: Bench) => {
                                    return {
                                        ...name,
                                        daysRequired: new Set(
                                            name.daysRequired
                                        ),
                                        daysPresent: new Set(name.daysPresent),
                                    };
                                }
                            ),
                        },
                    };
                },
                setItem: (name, newValue: StorageValue<BenchNamesState>) => {
                    const str = JSON.stringify({
                        ...newValue,
                        state: {
                            ...newValue.state,
                            names: newValue.state.names.map((name: Bench) => {
                                return {
                                    ...name,
                                    daysRequired: Array.from(name.daysRequired),
                                    daysPresent: Array.from(name.daysPresent),
                                };
                            }),
                        },
                    });
                    localStorage.setItem(name, str);
                },
                removeItem: (name) => localStorage.removeItem(name),
            },
        }
    )
);

//remove qualification from operators when a bench is deleted
useBenchNamesStore.subscribe((state, prevState) => {
    if (state.names.length < prevState.names.length) {
        const missingNames = [...prevState.names].filter(
            (n) => !state.names.map((b) => b.name).includes(n.name)
        );
        useOperatorQualificationsAndScheduleStore
            .getState()
            .removeQualificationForAllOperators(missingNames[0].name);
    }
});

interface OperatorQualificationsAndSchedulesState {
    operators: Operator[];
    addOperator: (name: string) => any;
    restoreOperator: (operator: Operator) => any;
    removeOperator: (name: string) => any;

    setQualificationsForOperator: (
        name: string,
        qualifications: string[]
    ) => any;
    addQualificationForOperator: (name: string, qualification: string) => any;
    removeQualificationForOperator: (
        name: string,
        qualification: string
    ) => any;
    removeQualificationForAllOperators: (qualification: string) => any;

    setCanFloatForOperator: (name: string, canFloat: boolean) => any;

    setOperatorInChargeDays: (name: string, days: WeekDay[]) => any;

    setWorkingDaysForOperator: (name: string, workingDays: WeekDay[]) => any;
    addWorkingDayForOperator: (name: string, day: WeekDay) => any;
    removeWorkingDayForOperator: (name: string, day: WeekDay) => any;

    setOperatorShift: (name: string, shift: ShiftType[]) => any;

    setOperatorSortIndex: (name: string, index: number) => any;
}

function hslToHex(h: number) {
    let s = 100;
    let l = 75;

    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color)
            .toString(16)
            .padStart(2, "0"); // convert to Hex and prefix "0" if needed
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}
function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const useOperatorQualificationsAndScheduleStore =
    create<OperatorQualificationsAndSchedulesState>()(
        persist(
            (set) => ({
                operators: [],
                addOperator: (name: string) =>
                    set((state) => {
                        const existingOperator = state.operators.find(
                            (operator) => operator.name === name
                        );
                        if (!existingOperator) {
                            const newArr: Operator[] = [
                                ...state.operators,
                                {
                                    name,
                                    qualifications: new Set(),
                                    schedule: new Set(),
                                    shift: new Set([
                                        "FIRST_HALF",
                                        "SECOND_HALF",
                                    ] as ShiftType[]),
                                    canFloat: false,
                                    isSupervisor: false,
                                    daysInCharge: new Set(),
                                },
                            ];
                            return {
                                operators: newArr,
                            };
                        } else {
                            return {
                                operators: [...state.operators],
                            };
                        }
                    }),
                restoreOperator: (operator: Operator) => {
                    set((state) => ({
                        operators: [...state.operators, operator],
                    }));
                },
                removeOperator: (name: string) =>
                    set((state) => {
                        return {
                            operators: state.operators.filter(
                                (operator) => operator.name !== name
                            ),
                        };
                    }),
                setQualificationsForOperator: (
                    name: string,
                    qualifications: string[]
                ) =>
                    set((state) => {
                        const changingOperator = state.operators.find(
                            (operator) => operator.name === name
                        );
                        if (changingOperator) {
                            changingOperator.qualifications.clear();
                            qualifications.forEach((q) =>
                                changingOperator.qualifications.add(q)
                            );
                            return {
                                operators: [...state.operators],
                            };
                        } else {
                            return {
                                operators: state.operators,
                            };
                        }
                    }),
                addQualificationForOperator: (
                    name: string,
                    qualification: string
                ) =>
                    set((state) => {
                        const changingOperator = state.operators.find(
                            (operator) => operator.name === name
                        );
                        if (changingOperator) {
                            changingOperator.qualifications.add(qualification);
                            return {
                                operators: [...state.operators],
                            };
                        } else {
                            return {
                                operators: state.operators,
                            };
                        }
                    }),
                removeQualificationForOperator: (
                    name: string,
                    qualification: string
                ) =>
                    set((state) => {
                        const changingOperator = state.operators.find(
                            (operator) => operator.name === name
                        );
                        if (changingOperator) {
                            changingOperator.qualifications.delete(
                                qualification
                            );
                            return {
                                operators: [...state.operators],
                            };
                        } else {
                            return {
                                operators: state.operators,
                            };
                        }
                    }),
                removeQualificationForAllOperators: (qualification: string) =>
                    set((state) => {
                        return {
                            operators: [...state.operators].map((op) => {
                                op.qualifications.delete(qualification);
                                return op;
                            }),
                        };
                    }),
                setCanFloatForOperator: (name: string, canFloat: boolean) =>
                    set((state) => {
                        const newArr = [...state.operators];
                        const changingOperator = newArr.find(
                            (op) => op.name === name
                        );
                        if (changingOperator) {
                            changingOperator.canFloat = canFloat;
                            if (!canFloat) {
                                changingOperator.daysInCharge.clear();
                            }
                            return {
                                operators: newArr,
                            };
                        } else {
                            return {
                                operators: state.operators,
                            };
                        }
                    }),
                setOperatorInChargeDays: (name: string, days: WeekDay[]) =>
                    set((state) => {
                        const changingOperator = state.operators.find(
                            (op) => op.name === name
                        );
                        if (changingOperator && changingOperator.canFloat) {
                            changingOperator.daysInCharge.clear();
                            days.forEach((d) =>
                                changingOperator.daysInCharge.add(d)
                            );
                            return {
                                operators: [...state.operators].map((o) => {
                                    if (o.name !== changingOperator.name) {
                                        changingOperator.daysInCharge.forEach(
                                            (d) => {
                                                o.daysInCharge.delete(d);
                                            }
                                        );
                                    }
                                    return o;
                                }),
                            };
                        } else {
                            return {
                                operators: state.operators,
                            };
                        }
                    }),
                setWorkingDaysForOperator: (
                    name: string,
                    workingDays: WeekDay[]
                ) => {
                    set((state) => {
                        const changingOperator = state.operators.find(
                            (o) => o.name === name
                        );
                        if (changingOperator) {
                            const operatorPrevDaysInCharge = Array.from(
                                changingOperator.daysInCharge
                            );

                            changingOperator.schedule.clear();
                            changingOperator.daysInCharge.clear();
                            workingDays.forEach((d) => {
                                changingOperator.schedule.add(d);
                                if (operatorPrevDaysInCharge.includes(d)) {
                                    changingOperator.daysInCharge.add(d);
                                }
                            });
                            return {
                                operators: [...state.operators],
                            };
                        } else {
                            return {
                                operators: [...state.operators],
                            };
                        }
                    });
                },
                addWorkingDayForOperator: (name: string, day: WeekDay) =>
                    set((state) => {
                        const changingOperator = state.operators.find(
                            (operator) => operator.name === name
                        );
                        if (changingOperator) {
                            changingOperator.schedule.add(day);
                            return {
                                operators: [...state.operators],
                            };
                        } else {
                            return {
                                operators: [...state.operators],
                            };
                        }
                    }),
                removeWorkingDayForOperator: (name: string, day: WeekDay) => {
                    set((state) => {
                        const changingOperator = state.operators.find(
                            (operator) => operator.name === name
                        );
                        if (changingOperator) {
                            changingOperator.schedule.delete(day);
                            changingOperator.daysInCharge.delete(day);
                            return {
                                operators: [...state.operators],
                            };
                        } else {
                            return {
                                operators: [...state.operators],
                            };
                        }
                    });
                },
                setOperatorShift: (name: string, shift: ShiftType[]) => {
                    set((state) => {
                        const changingOperator = state.operators.find(
                            (operator) => operator.name === name
                        );
                        if (changingOperator) {
                            changingOperator.shift.clear();
                            shift.forEach((s) => changingOperator.shift.add(s));
                            return {
                                operators: [...state.operators],
                            };
                        } else {
                            return {
                                operators: [...state.operators],
                            };
                        }
                    });
                },
                setOperatorSortIndex: (name: string, index: number) => {
                    set((state) => {
                        const newArr = [...state.operators];
                        const changingOperator = newArr.find(
                            (operator) => operator.name === name
                        );
                        if (changingOperator) {
                            const idx =
                                state.operators.indexOf(changingOperator);
                            if (idx >= 0) {
                                newArr.splice(idx, 1);
                                newArr.splice(index, 0, changingOperator);
                                return {
                                    operators: newArr,
                                };
                            }
                        }
                        return {
                            operators: [...state.operators],
                        };
                    });
                },
            }),
            {
                name: "operator-qualifications-storage",
                storage: {
                    getItem: (name) => {
                        const str = localStorage.getItem(name);
                        if (!str) return null;
                        const existingValue = JSON.parse(str);
                        return {
                            ...existingValue,
                            state: {
                                ...existingValue.state,
                                operators: existingValue.state.operators.map(
                                    (operator: Operator) => {
                                        return {
                                            ...operator,
                                            qualifications: new Set(
                                                operator.qualifications
                                            ),
                                            schedule: new Set(
                                                operator.schedule
                                            ),
                                            shift: new Set(operator.shift),
                                            daysInCharge: new Set(
                                                operator.daysInCharge
                                            ),
                                        };
                                    }
                                ),
                            },
                        };
                    },
                    setItem: (
                        name,
                        newValue: StorageValue<OperatorQualificationsAndSchedulesState>
                    ) => {
                        const str = JSON.stringify({
                            ...newValue,
                            state: {
                                ...newValue.state,
                                operators: newValue.state.operators.map(
                                    (operator) => {
                                        return {
                                            ...operator,
                                            qualifications: Array.from(
                                                operator.qualifications
                                            ),
                                            schedule: Array.from(
                                                operator.schedule
                                            ),
                                            shift: Array.from(operator.shift),
                                            daysInCharge: Array.from(
                                                operator.daysInCharge
                                            ),
                                        };
                                    }
                                ),
                            },
                        });
                        localStorage.setItem(name, str);
                    },
                    removeItem: (name) => localStorage.removeItem(name),
                },
            }
        )
    );

export type BenchPin = {
    day: WeekDay;
    operator: string;
    bench: string;
    shift: Set<ShiftType>;
};

interface PinnedAssignmentState {
    pins: BenchPin[];
    addPinnedAssignment: (
        day: WeekDay,
        operator: string,
        bench: string,
        shift: Set<ShiftType>
    ) => any;
    removePinnedAssignment: (day: WeekDay, operator: string) => any;
    clearPins: () => any;
}

export type ScheduleWeek = {
    scheduleDays: {
        [x: string]: {
            weekDay: WeekDay;
            benchAssignments: {
                [x: string]: string[];
            };
        };
    };
};

interface ScheduleWeeksState {
    scheduleWeeks: ScheduleWeek;
    isScheduleFilled: boolean;
    setScheduleWeeks: (weeks: ScheduleWeek) => any;
    refreshSchedule: (
        benchNames: Bench[],
        operators: Operator[],
        cb?: () => any
    ) => any;
    clearCurrentSchedule: () => any;
}

export const useScheduleWeeksStore = create<
    ScheduleWeeksState & PinnedAssignmentState
>()(
    persist(
        (set, get) => ({
            scheduleWeeks: {
                scheduleDays: {},
            },
            isScheduleFilled: false,
            refreshSchedule: async (
                benchNames: Bench[],
                operators: Operator[],
                cb?: () => any
            ) => {
                if (useSchedulerErrorStore.getState().errors.length > 0) {
                    console.log(
                        "Schedule refresh was triggered, but there were one or more configuration errors."
                    );
                    return 0;
                }

                const res = await fetch(
                    API_URL +
                        (API_PORT ? ":" + API_PORT : "") +
                        API_ENDPOINT +
                        "?benches=" +
                        encodeURIComponent(
                            JSON.stringify({
                                benches: benchNames.map((b) => {
                                    return {
                                        ...b,
                                        daysRequired: Array.from(
                                            b.daysRequired
                                        ),
                                        daysPresent: Array.from(b.daysPresent),
                                    };
                                }),
                            })
                        ) +
                        "&operators=" +
                        encodeURIComponent(
                            JSON.stringify({
                                operators: operators.map((o) => {
                                    return {
                                        ...o,
                                        schedule: Array.from(o.schedule),
                                        qualifications: Array.from(
                                            o.qualifications
                                        ),
                                        daysInCharge: Array.from(
                                            o.daysInCharge
                                        ),
                                        shift: Array.from(o.shift),
                                    };
                                }),
                            })
                        ) +
                        "&pins=" +
                        encodeURIComponent(
                            JSON.stringify({
                                pins: get().pins.map((o) => {
                                    return {
                                        ...o,
                                        shift: Array.from(o.shift),
                                    };
                                }),
                            })
                        )
                );

                const newData: ScheduleWeek = await res.json();

                const theWeek = newData ? newData : ({} as ScheduleWeek);

                if (cb) cb();

                set({
                    scheduleWeeks: theWeek,
                    isScheduleFilled: true,
                });
            },
            clearCurrentSchedule: () =>
                set((state) => {
                    const asdf: {
                        [x: string]: {
                            weekDay: WeekDay;
                            benchAssignments: {
                                [x: string]: string[];
                            };
                        };
                    } = {};

                    get().pins.forEach((pin) => {
                        const day = pin.day;

                        if (asdf[day]) {
                            if (asdf[day].benchAssignments[pin.bench]) {
                                asdf[day].benchAssignments[pin.bench].push(
                                    pin.operator
                                );
                            } else {
                                asdf[day].benchAssignments[pin.bench] = [
                                    pin.operator,
                                ];
                            }
                        } else {
                            asdf[day] = {
                                weekDay: day,
                                benchAssignments: {
                                    [pin.bench]: [pin.operator],
                                },
                            };
                        }
                    });

                    return {
                        scheduleWeeks: { scheduleDays: asdf },
                        isScheduleFilled: false,
                    };
                }),
            setScheduleWeeks: (weeks: ScheduleWeek) =>
                set((state) => {
                    return {
                        scheduleWeeks: weeks,
                        pins: state.pins,
                    };
                }),

            pins: [],
            addPinnedAssignment: (
                day: WeekDay,
                operator: string,
                bench: string,
                shift: Set<ShiftType>
            ) =>
                set((state) => {
                    console.log(day, operator, bench, shift);
                    const benchPinned = state.pins.find(
                        (p) =>
                            p.bench === bench &&
                            p.day === day &&
                            Array.from(p.shift).every((x) => shift.has(x))
                    );
                    const operatorPinned = state.pins.find(
                        (p) => p.operator === operator && p.day === day
                    );

                    let newPins = [...state.pins];

                    if (benchPinned) {
                        console.log(
                            "the bench already had a pin for the given day and shift"
                        );
                        newPins = newPins.filter((p) => p.bench != bench);
                    }

                    if (operatorPinned) {
                        console.log(
                            "the operator already had a different pin on the day"
                        );
                        newPins = newPins.filter((p) => p.operator != operator);
                    }

                    return {
                        pins: [...newPins, { day, operator, bench, shift }],
                    };
                }),
            removePinnedAssignment: (day: WeekDay, operator: string) =>
                set((state) => {
                    return {
                        pins: state.pins.filter((p) => {
                            return !(p.day == day && p.operator == operator);
                        }),
                    };
                }),
            clearPins: () => set((state) => ({ pins: [] })),
        }),
        {
            name: "pinned-assignment-state-store",
            storage: {
                getItem: (name) => {
                    const str = localStorage.getItem(name);
                    if (!str) return null;
                    const existingValue = JSON.parse(str);
                    return {
                        ...existingValue,
                        state: {
                            ...existingValue.state,
                            pins: existingValue.state.pins.map(
                                (pin: BenchPin) => {
                                    return {
                                        ...pin,
                                        shift: new Set(pin.shift),
                                    };
                                }
                            ),
                        },
                    };
                },
                setItem: (
                    name,
                    newValue: StorageValue<
                        ScheduleWeeksState & PinnedAssignmentState
                    >
                ) => {
                    const str = JSON.stringify({
                        ...newValue,
                        state: {
                            ...newValue.state,
                            pins: newValue.state.pins.map((pin: BenchPin) => {
                                return {
                                    ...pin,
                                    shift: Array.from(pin.shift),
                                };
                            }),
                        },
                    });
                    localStorage.setItem(name, str);
                },
                removeItem: (name) => localStorage.removeItem(name),
            },
        }
    )
);

export function scheduleWeekToCsv() {
    const week: ScheduleWeek = useScheduleWeeksStore.getState().scheduleWeeks;
    const operators: Operator[] =
        useOperatorQualificationsAndScheduleStore.getState().operators;

    const operatorNames = ["", ...operators.map((o) => o.name)];
    operatorNames.forEach((val: string) => {
        if (val !== "") {
            val +
                Object.entries(week.scheduleDays).map((val) => {
                    const weekDay = val[0];
                    const content = val[1];

                    Object.entries(content.benchAssignments).find(
                        ([benchName, operatorNames]) => {}
                    );
                });
        } else {
            "," + weekdays.join(",") + "\\n";
        }
    });
}

//trigger a schedule refresh whenever a pin is added/removed
useScheduleWeeksStore.subscribe((state, prevState) => {
    if (state.pins != prevState.pins && state.pins.length > 0) {
        if (useScheduleWeeksStore.getState().isScheduleFilled) {
            const benches = useBenchNamesStore.getState();
            const operators =
                useOperatorQualificationsAndScheduleStore.getState();
            state.refreshSchedule(benches.names, operators.operators);
        } else {
            const asdf: {
                [x: string]: {
                    weekDay: WeekDay;
                    benchAssignments: {
                        [x: string]: string[];
                    };
                };
            } = {};

            state.pins.forEach((pin) => {
                const day = pin.day;

                if (asdf[day]) {
                    if (asdf[day].benchAssignments[pin.bench]) {
                        asdf[day].benchAssignments[pin.bench].push(
                            pin.operator
                        );
                    } else {
                        asdf[day].benchAssignments[pin.bench] = [pin.operator];
                    }
                } else {
                    asdf[day] = {
                        weekDay: day,
                        benchAssignments: {
                            [pin.bench]: [pin.operator],
                        },
                    };
                }
            });

            useScheduleWeeksStore.setState({
                scheduleWeeks: {
                    scheduleDays: asdf,
                },
            });
        }
    }
});

//remove pins for an operator when the operator is removed or has the pinned bench removed from their qualifications
useOperatorQualificationsAndScheduleStore.subscribe((state, prevState) => {
    useScheduleWeeksStore.setState({
        pins: useScheduleWeeksStore
            .getState()
            .pins.filter(
                (p) =>
                    state.operators.map((o) => o.name).includes(p.operator) &&
                    state.operators
                        .find((o) => o.name == p.operator)
                        ?.schedule.has(p.day) &&
                    state.operators
                        .find((o) => o.name == p.operator)
                        ?.qualifications.has(p.bench)
            ),
    });
});

useOperatorQualificationsAndScheduleStore.subscribe((state, prevState) => {
    state.operators.forEach((operator) => {
        if (operator.qualifications.size == 1) {
            operator.schedule.forEach((day) => {
                useScheduleWeeksStore
                    .getState()
                    .addPinnedAssignment(
                        day,
                        operator.name,
                        Array.from(operator.qualifications)[0],
                        operator.shift
                    );
            });
        }
    });
});

interface ScheduleTableViewOptionsState {
    showEmptySlots: boolean;
    toggleShowEmptySlots: () => any;
    highlightEmptySlots: boolean;
    toggleHighlightEmptySlots: () => any;
    showOperatorsOff: boolean;
    toggleShowOperatorsOff: () => any;
    showHalfShifts: boolean;
    toggleShowHalfShifts: () => any;
}

export const useScheduleTableViewOptionsStore =
    create<ScheduleTableViewOptionsState>()(
        persist(
            (set, get) => ({
                showEmptySlots: false,
                toggleShowEmptySlots: () =>
                    set({
                        showEmptySlots: !get().showEmptySlots,
                        highlightEmptySlots: !!get().showEmptySlots
                            ? false
                            : get().highlightEmptySlots,
                    }),
                highlightEmptySlots: false,
                toggleHighlightEmptySlots: () =>
                    set({
                        highlightEmptySlots: !get().highlightEmptySlots,
                    }),
                showOperatorsOff: false,
                toggleShowOperatorsOff: () =>
                    set({
                        showOperatorsOff: !get().showOperatorsOff,
                    }),
                showHalfShifts: false,
                toggleShowHalfShifts: () =>
                    set({ showHalfShifts: !get().showHalfShifts }),
            }),
            {
                name: "schedule-table-view-options-store",
            }
        )
    );

export type SchedulerErrorType = "GENERAL";
export type SchedulerErrorSeverity = "LOW" | "MED" | "HIGH" | "CRITICAL";

export interface SchedulerError {
    message: string;
    type: SchedulerErrorType;
    severity: SchedulerErrorSeverity;
    toJson: () => {};
}

export class OperatorSchedulerError implements SchedulerError {
    message: string;
    type: "GENERAL";
    severity: SchedulerErrorSeverity;

    operator: Operator;

    constructor(
        message: string,
        type: SchedulerErrorType,
        severity: SchedulerErrorSeverity,
        operator: Operator
    ) {
        this.message = message;
        this.type = "GENERAL";
        this.severity = "LOW";
        this.operator = operator;
    }
    toJson() {
        return {
            message: this.message,
            type: this.type + "",
            severity: this.severity + "",
            operator: {
                name: this.operator.name,
            },
        };
    }

    getOperator() {
        return this.operator;
    }
}

export class BenchSchedulerError implements SchedulerError {
    message: string;
    type: "GENERAL";
    severity: SchedulerErrorSeverity;

    bench: Bench;

    constructor(
        message: string,
        type: SchedulerErrorType,
        severity: SchedulerErrorSeverity,
        bench: Bench
    ) {
        this.message = message;
        this.type = "GENERAL";
        this.severity = "LOW";
        this.bench = bench;
    }
    toJson() {
        return {
            message: this.message,
            type: this.type + "",
            severity: this.severity + "",
            bench: {
                name: this.bench.name,
            },
        };
    }

    getBench() {
        return this.bench;
    }
}

export class ScheduleSchedulerError implements SchedulerError {
    message: string;
    type: "GENERAL";
    severity: SchedulerErrorSeverity;
    schedule: ScheduleWeek;

    constructor(
        message: string,
        type: SchedulerErrorType,
        severity: SchedulerErrorSeverity,
        schedule: ScheduleWeek
    ) {
        this.message = message;
        this.type = type;
        this.severity = severity;
        this.schedule = schedule;
    }
    toJson() {
        return {
            message: this.message,
            type: this.type + "",
            severity: this.severity + "",
            schedule: this.schedule,
        };
    }

    getSchedule() {
        return this.schedule;
    }
}

interface ScheduleErrorState {
    errors: SchedulerError[];
    addError: (error: SchedulerError) => any;
    setErrors: (errors: SchedulerError[]) => any;
    clearErrors: () => any;

    getCriticalErrors: () => SchedulerError[];

    getErrorsForOperator: (name: string) => OperatorSchedulerError[];
    getErrorsForBench: (name: string) => BenchSchedulerError[];
}

export const useSchedulerErrorStore = create<ScheduleErrorState>()(
    persist(
        (set, get) => ({
            errors: [],
            addError: (error: SchedulerError) =>
                set((state) => {
                    return {
                        errors: [...state.errors, error],
                    };
                }),
            setErrors: (errors: SchedulerError[]) =>
                set((state) => {
                    return {
                        errors,
                    };
                }),
            clearErrors: () =>
                set((state) => {
                    return {
                        errors: [],
                    };
                }),
            getCriticalErrors: () => {
                return get().errors.filter(
                    (error) => error.severity === "CRITICAL"
                ) as SchedulerError[];
            },
            getErrorsForOperator: (name: string) => {
                return get().errors.filter(
                    (error) =>
                        error instanceof OperatorSchedulerError &&
                        error.getOperator().name === name
                ) as OperatorSchedulerError[];
            },
            getErrorsForBench: (name: string) => {
                return get().errors.filter(
                    (error) =>
                        error instanceof BenchSchedulerError &&
                        error.getBench().name === name
                ) as BenchSchedulerError[];
            },
        }),
        {
            name: "scheduler-error-store",
            storage: {
                /*getItem: (name) => {
                    const str = localStorage.getItem(name);
                    if (!str) return null;
                    const existingValue = JSON.parse(str);
                    return {
                        ...existingValue,
                        state: {
                            ...existingValue.state,
                            pins: existingValue.state.pins.map(
                                (pin: BenchPin) => {
                                    return {
                                        ...pin,
                                        shift: new Set(pin.shift),
                                    };
                                }
                            ),
                        },
                    };
                },*/
                getItem: (name) => {
                    const str = localStorage.getItem(name);
                    if (!str) return null;
                    const existingValue = JSON.parse(str);
                    return {
                        ...existingValue,
                        state: {
                            ...existingValue.state,
                            //@ts-ignore
                            errors: existingValue.state.errors.map((value) => {
                                console.log(
                                    "reading error value in from local json"
                                );
                                console.log(value);
                                if (!!value.operator) {
                                    return new OperatorSchedulerError(
                                        value.message,
                                        value.type,
                                        value.severity,
                                        value.operator
                                    );
                                } else if (!!value.bench) {
                                    return new BenchSchedulerError(
                                        value.message,
                                        value.type,
                                        value.severity,
                                        value.bench
                                    );
                                }
                            }),
                        },
                    };
                },
                setItem: (name, newValue: StorageValue<ScheduleErrorState>) => {
                    const str = JSON.stringify({
                        ...newValue,
                        state: {
                            ...newValue.state,
                            /*pins: newValue.state.errors.map((error: SchedulerError) => {
                                return {
                                    ...pin,
                                    shift: Array.from(pin.shift),
                                };
                            }),*/
                            errors: newValue.state.errors.map(
                                (err: SchedulerError) => {
                                    return err.toJson();
                                }
                            ),
                        },
                    });
                    localStorage.setItem(name, str);
                },
                removeItem: (name) => localStorage.removeItem(name),
            },
        }
    )
);

useBenchNamesStore.subscribe((state, prevState) => {
    rescanErrors();
});

useOperatorQualificationsAndScheduleStore.subscribe((state, prevState) => {
    rescanErrors();
});

/*
    things to check for:
        - if an operator is a float, they must be qualified for all benches
        - bench must have at least one operator qualified per day present
        - must be minimum number of operators present
*/

const OPERATOR_FLOAT_BENCHES_MISMATCH =
    "The operator is labeled 'Float' but is missing one or more bench qualifications.";

const QUALIFIED_OPERATOR_NOT_PRESENT_ON_DAY =
    "The bench is missing at least one qualified operator on one or more days.";

const NOT_ENOUGH_OPERATORS_FOR_DAY =
    "There are not enough operators for at least one day of the schedule.";

function rescanErrors() {
    console.log("rescanning for errors");

    useSchedulerErrorStore.getState().clearErrors();

    /* check that there is at least one operator for each required bench */
    useBenchNamesStore.getState().names.forEach((bench) => {
        bench.daysPresent.forEach((benchDay) => {
            const areQualifiedOperatorsPresentOnDay =
                useOperatorQualificationsAndScheduleStore
                    .getState()
                    .operators.some(
                        (operator) =>
                            operator.schedule.has(benchDay) &&
                            operator.qualifications.has(bench.name)
                    );

            if (!areQualifiedOperatorsPresentOnDay) {
                useSchedulerErrorStore
                    .getState()
                    .addError(
                        new BenchSchedulerError(
                            QUALIFIED_OPERATOR_NOT_PRESENT_ON_DAY,
                            "GENERAL",
                            "CRITICAL",
                            bench
                        )
                    );
            }
        });
    });

    weekdays.forEach((day) => {
        const operatorsOnDay = useOperatorQualificationsAndScheduleStore
            .getState()
            .operators.filter((o) => o.schedule.has(day));
        const numWholeShiftOperators = operatorsOnDay.filter(
            (o) => o.shift.size == 2
        ).length;
        const numFirstShiftOperators = operatorsOnDay.filter(
            (o) => o.shift.size == 1 && o.shift.has("FIRST_HALF")
        ).length;
        const numSecondShiftOperators = operatorsOnDay.filter(
            (o) => o.shift.size == 1 && o.shift.has("SECOND_HALF")
        ).length;

        const magicNumber =
            numWholeShiftOperators +
            Math.min(numFirstShiftOperators, numSecondShiftOperators);

        const numRequiredBenchesForDay = useBenchNamesStore
            .getState()
            .names.filter((b) => b.daysRequired.has(day)).length;

        if (magicNumber < numRequiredBenchesForDay) {
            useSchedulerErrorStore
                .getState()
                .addError(
                    new ScheduleSchedulerError(
                        NOT_ENOUGH_OPERATORS_FOR_DAY,
                        "GENERAL",
                        "CRITICAL",
                        useScheduleWeeksStore.getState().scheduleWeeks
                    )
                );
        }
    });

    /** check for float operator errors **/
    useOperatorQualificationsAndScheduleStore
        .getState()
        .operators.forEach((operator) => {
            if (operator.canFloat) {
                const operatorIsQualifiedForAllBenches = useBenchNamesStore
                    .getState()
                    .names.every((bench) =>
                        operator.qualifications.has(bench.name)
                    );
                if (!operatorIsQualifiedForAllBenches) {
                    useSchedulerErrorStore
                        .getState()
                        .addError(
                            new OperatorSchedulerError(
                                OPERATOR_FLOAT_BENCHES_MISMATCH,
                                "GENERAL",
                                "CRITICAL",
                                operator
                            )
                        );
                }
            }
        });
}
