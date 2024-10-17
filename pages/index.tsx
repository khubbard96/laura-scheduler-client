"use client";

import { SubTitle, Title } from "@/components/Components";
import {
    Bench,
    BenchPin,
    Operator,
    ShiftType,
    WeekDay,
    shiftToString,
    useBenchNamesStore,
    useOperatorQualificationsAndScheduleStore,
    useScheduleTableViewOptionsStore,
    useScheduleWeeksStore,
    useSchedulerErrorStore,
    weekdayToString,
    weekdays,
} from "@/store";
import { ThemeProvider } from "@emotion/react";
import {
    Badge,
    Box,
    Button,
    ButtonGroup,
    Chip,
    CircularProgress,
    Collapse,
    Container,
    CssBaseline,
    Divider,
    FormControl,
    Grid,
    Icon,
    IconButton,
    InputLabel,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    MenuList,
    OutlinedInput,
    Paper,
    Select,
    SelectChangeEvent,
    Slide,
    Slider,
    Snackbar,
    Stack,
    Switch,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    TextField,
    Theme,
    Tooltip,
    createTheme,
    useTheme,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import PushPinIcon from "@mui/icons-material/PushPin";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckIcon from "@mui/icons-material/Check";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import WatchLaterOutlinedIcon from "@mui/icons-material/WatchLaterOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import IosShareIcon from "@mui/icons-material/IosShare";
import GridOnIcon from "@mui/icons-material/GridOn";
import CloseIcon from "@mui/icons-material/Close";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import WavesIcon from "@mui/icons-material/Waves";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import React, { Fragment, MouseEventHandler, useEffect, useState } from "react";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { Add, Remove } from "@mui/icons-material";
import DeleteIcon from "@mui/icons-material/Delete";

const API_ENDPOINT = "/schedule";
const API_PORT = "8080";
const API_URL = "http://localhost";

const ROW_HEADER_TITLE = "Operator";
const FLOAT_BENCH_TEXT = "Float";

export default function Home() {
    const defaultTheme = createTheme({
        palette: {
            mode: "dark",
        },
    });

    return (
        <ThemeProvider theme={defaultTheme}>
            <Box sx={{ display: "flex" }}>
                <CssBaseline />
                <Box
                    component="main"
                    sx={{
                        backgroundColor: (theme) =>
                            theme.palette.mode === "light"
                                ? theme.palette.grey[100]
                                : theme.palette.grey[900],
                        flexGrow: 1,
                        height: "100vh",
                        overflow: "hidden",
                    }}
                >
                    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                        {/*<Grid container>
                            <Grid item xs={12} md={12} lg={12}>*/}
                        <Paper
                            sx={{
                                p: 2,
                                display: "flex",
                                flexDirection: "column",
                                maxHeight: "90vh",
                            }}
                        >
                            <MainViewWidget />
                        </Paper>
                        {/*</Grid>*/}
                        {/*
                            <Grid item xs={12} md={8} lg={9}>
                                <Paper
                                    sx={{
                                        p: 2,
                                        display: "flex",
                                        flexDirection: "column",
                                        minHeight: 240,
                                    }}
                                >
                                    <OperatorNamesView />
                                </Paper>
                            </Grid>
                            <Grid item xs={12} md={4} lg={3}>
                                <Paper
                                    sx={{
                                        p: 2,
                                        display: "flex",
                                        flexDirection: "column",
                                        marginBottom: 3
                                    }}
                                >
                                    <PinnedAssignmentsView />
                                </Paper>
                                <Paper
                                    sx={{
                                        p: 2,
                                        display: "flex",
                                        flexDirection: "column",
                                        minHeight: 240,
                                    }}
                                >
                                    <BenchNamesView />
                                </Paper>
                            </Grid>
                        </Grid>*/}
                    </Container>
                </Box>
            </Box>
        </ThemeProvider>
    );
}

function MainViewWidget() {
    const [viewValue, setViewValue] = useState<0 | 1 | 2 | 3>(0);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        if (
            newValue === 0 ||
            newValue === 1 ||
            newValue === 2 ||
            newValue === 3
        ) {
            setViewValue(newValue);
        }
    };

    const operatorErrors = useSchedulerErrorStore().errors;

    return (
        <Box sx={{ width: "100%" }}>
            <Box style={{ float: "right" }}>
                {operatorErrors.length > 0 ? (
                    <Tooltip
                        title={
                            "There are one or more errors with the scheduler configuration."
                        }
                        color="warning"
                    >
                        <Icon>
                            <ReportProblemIcon />
                        </Icon>
                    </Tooltip>
                ) : (
                    <></>
                )}
            </Box>
            <Box>
                <Tabs value={viewValue} onChange={handleChange} centered>
                    <Tab label="Schedule" />
                    <Tab label="Benches" />
                    <Tab label="Operators" />
                    <Tab label="Pins" />
                </Tabs>
            </Box>

            <Box
                display={"flex"}
                flexDirection={"column"}
                sx={{ height: "100%" }}
            >
                {viewValue === 0 ? (
                    <ScheduleTableView />
                ) : viewValue === 1 ? (
                    <BenchNamesView />
                ) : viewValue === 2 ? (
                    <OperatorNamesView />
                ) : viewValue === 3 ? (
                    <PinnedAssignmentsView />
                ) : (
                    <></>
                )}
            </Box>
        </Box>
    );
}

function ScheduleTableView() {
    const benchNames = useBenchNamesStore((s) => s.names);
    const operatorQualificationsStore =
        useOperatorQualificationsAndScheduleStore();
    const scheduleWeeksStore = useScheduleWeeksStore();

    const getBench = (operator: Operator, day: WeekDay): Bench | undefined => {
        if (!scheduleWeeksStore.scheduleWeeks.scheduleDays) return undefined;

        //get all bench assignments for the given day
        const dayBenchAssignments = Object.entries(
            scheduleWeeksStore.scheduleWeeks?.scheduleDays[day]
                ?.benchAssignments || {}
        );

        //find the given operator's assignment on the day
        const dayAssignmentForOperator = dayBenchAssignments.find(
            ([benchName, opNames]) => {
                return opNames.includes(operator.name);
            }
        );

        if (dayAssignmentForOperator) {
            const benchName = dayAssignmentForOperator[0];
            const bench = benchNames.find((b) => b.name === benchName);
            if (bench) return bench;
            else if (benchName === FLOAT_BENCH_TEXT) {
                return {
                    name: "Float",
                } as Bench;
            }
        }
    };

    const [viewOptionsMenuAnchorEl, setViewOptionsMenuAnchorEl] =
        useState<null | HTMLElement>(null);
    const viewOptionsMenuOpen = Boolean(viewOptionsMenuAnchorEl);
    const handleScheduleTableViewOptionsClick = (
        event: React.MouseEvent<HTMLButtonElement>
    ) => {
        setViewOptionsMenuAnchorEl(event.currentTarget);
    };
    const handleViewOptionsMenuClose = () => {
        setViewOptionsMenuAnchorEl(null);
    };

    const scheduleTableViewOptionsStore = useScheduleTableViewOptionsStore();

    const [exportOptionsMenuAnchorEl, setExportOptionsMenuAnchorEl] =
        useState<null | HTMLElement>(null);
    const exportOptionsMenuOpen = Boolean(exportOptionsMenuAnchorEl);
    const handleExportOptionsMenuOpenClick = (
        event: React.MouseEvent<HTMLButtonElement>
    ) => {
        setExportOptionsMenuAnchorEl(event.currentTarget);
    };
    const handleExportOptionsMenuClose = () => {
        setExportOptionsMenuAnchorEl(null);
    };

    //person in charge menu wireup
    const [personInChargeMenuAnchorEl, setPersonInChargeMenuAnchorEl] =
        useState<null | HTMLElement>(null);
    const [selectedPersonInCharge, setSelectedPersonInCharge] =
        useState<null | { day: WeekDay; operator: Operator | null }>(null);
    const handleOpenPersonInChargeMenu = (
        e: React.MouseEvent<HTMLDivElement>
    ) => {
        setPersonInChargeMenuAnchorEl(e.currentTarget);
    };

    const handleClosePersonInChargeMenu = () => {
        setPersonInChargeMenuAnchorEl(null);
    };

    //operator bench pin select menu wireup
    const [operatorBenchPinMenuAnchorEl, setOperatorBenchPinMenuAnchorEl] =
        useState<null | HTMLElement>(null);
    const [selectedOperator, setSelectedOperator] = useState<null | {
        operator: Operator;
        day: WeekDay;
    }>(null);
    const handleOpenOperatorBenchPinMenu = (
        e: React.MouseEvent<HTMLDivElement>
    ) => {
        setOperatorBenchPinMenuAnchorEl(e.currentTarget);
    };
    const handleCloseOperatorBenchPinMenu = () => {
        setOperatorBenchPinMenuAnchorEl(null);
        setSelectedOperator(null);
    };

    const [progress, setProgress] = useState(0);
    return (
        <Box>
            <Box
                display={"flex"}
                flexDirection={"row"}
                justifyContent={"space-between"}
            >
                <Box>
                    <Title>Schedule</Title>
                </Box>
                <Box>
                    <IconButton onClick={handleExportOptionsMenuOpenClick}>
                        <IosShareIcon />
                    </IconButton>
                    <Menu
                        anchorEl={exportOptionsMenuAnchorEl}
                        open={exportOptionsMenuOpen}
                        onClose={handleExportOptionsMenuClose}
                    >
                        <MenuItem>
                            <ListItemIcon>
                                <GridOnIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Export to Excel</ListItemText>
                        </MenuItem>
                    </Menu>
                    <IconButton onClick={handleScheduleTableViewOptionsClick}>
                        <MenuIcon />
                    </IconButton>
                    <Menu
                        anchorEl={viewOptionsMenuAnchorEl}
                        open={viewOptionsMenuOpen}
                        onClose={handleViewOptionsMenuClose}
                    >
                        <MenuItem
                            onClick={
                                scheduleTableViewOptionsStore.toggleShowEmptySlots
                            }
                        >
                            Show empties{" "}
                            <Switch
                                checked={
                                    scheduleTableViewOptionsStore.showEmptySlots
                                }
                                onChange={
                                    scheduleTableViewOptionsStore.toggleShowEmptySlots
                                }
                            />
                        </MenuItem>
                        <MenuItem
                            disabled={
                                !scheduleTableViewOptionsStore.showEmptySlots
                            }
                            onClick={
                                scheduleTableViewOptionsStore.toggleHighlightEmptySlots
                            }
                        >
                            Highlight empties
                            <Switch
                                checked={
                                    scheduleTableViewOptionsStore.highlightEmptySlots
                                }
                                onChange={
                                    scheduleTableViewOptionsStore.toggleHighlightEmptySlots
                                }
                            />
                        </MenuItem>
                        <MenuItem
                            onClick={
                                scheduleTableViewOptionsStore.toggleShowOperatorsOff
                            }
                        >
                            Show ops. off
                            <Switch
                                checked={
                                    scheduleTableViewOptionsStore.showOperatorsOff
                                }
                                onChange={
                                    scheduleTableViewOptionsStore.toggleShowOperatorsOff
                                }
                            />
                        </MenuItem>
                        <MenuItem
                            onClick={
                                scheduleTableViewOptionsStore.toggleShowHalfShifts
                            }
                        >
                            Show half shifts
                            <Switch
                                checked={
                                    scheduleTableViewOptionsStore.showHalfShifts
                                }
                                onChange={
                                    scheduleTableViewOptionsStore.toggleShowHalfShifts
                                }
                            />
                        </MenuItem>
                    </Menu>
                </Box>
            </Box>
            <TableContainer sx={{ minHeight: "220px" }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            {[ROW_HEADER_TITLE, ...weekdays].map(
                                (header, idx) => {
                                    const operatorInCharge =
                                        operatorQualificationsStore.operators.find(
                                            (operator) => {
                                                return (
                                                    operator.canFloat &&
                                                    operator.daysInCharge &&
                                                    operator.daysInCharge.has(
                                                        header as WeekDay
                                                    )
                                                );
                                            }
                                        );

                                    return (
                                        <TableCell key={idx} align={"left"}>
                                            {header}
                                            {
                                                <Tooltip title="Select an in-charge operator" placement="top">
                                                    {header !==
                                                    ROW_HEADER_TITLE ? (
                                                        operatorInCharge ? (
                                                            <Chip
                                                                size="small"
                                                                variant="filled"
                                                                label={
                                                                    operatorInCharge.name
                                                                }
                                                                sx={{
                                                                    float: "right",
                                                                    cursor: "pointer",
                                                                }}
                                                                icon={
                                                                    <StarIcon />
                                                                }
                                                                color="primary"
                                                                onClick={(
                                                                    e
                                                                ) => {
                                                                    setSelectedPersonInCharge(
                                                                        {
                                                                            day: header as WeekDay,
                                                                            operator:
                                                                                operatorInCharge,
                                                                        }
                                                                    );
                                                                    handleOpenPersonInChargeMenu(
                                                                        e
                                                                    );
                                                                }}
                                                            />
                                                        ) : (
                                                            <Chip
                                                                size="small"
                                                                variant="outlined"
                                                                label="NONE"
                                                                sx={{
                                                                    float: "right",
                                                                    cursor: "pointer",
                                                                }}
                                                                icon={
                                                                    <StarBorderIcon />
                                                                }
                                                                onClick={(
                                                                    e
                                                                ) => {
                                                                    setSelectedPersonInCharge(
                                                                        {
                                                                            day: header as WeekDay,
                                                                            operator:
                                                                                null,
                                                                        }
                                                                    );
                                                                    handleOpenPersonInChargeMenu(
                                                                        e
                                                                    );
                                                                }}
                                                            />
                                                        )
                                                    ) : (
                                                        <></>
                                                    )}
                                                </Tooltip>
                                            }
                                        </TableCell>
                                    );
                                }
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {operatorQualificationsStore.operators.map(
                            (operator, idx) => (
                                <TableRow key={idx}>
                                    {[operator.name, ...weekdays].map(
                                        (el, _idx) =>
                                            el === operator.name ? (
                                                <TableCell
                                                    component="th"
                                                    scope="row"
                                                    key={_idx}
                                                >
                                                    {el}

                                                    {operator.shift.size == 1 &&
                                                        (operator.shift.has(
                                                            "FIRST_HALF"
                                                        ) ? (
                                                            //@ts-ignore
                                                            <LightModeIcon fontSize="tiny" />
                                                        ) : (
                                                            //@ts-ignore
                                                            <DarkModeIcon fontSize="tiny" />
                                                        ))}
                                                </TableCell>
                                            ) : scheduleWeeksStore.scheduleWeeks ? (
                                                <BenchAssignmentView
                                                    operator={operator}
                                                    bench={getBench(
                                                        operator,
                                                        el as WeekDay
                                                    )}
                                                    day={el as WeekDay}
                                                    key={_idx}
                                                    onClick={(e) => {
                                                        if (
                                                            operator.schedule.has(
                                                                el as WeekDay
                                                            )
                                                        ) {
                                                            setSelectedOperator(
                                                                {
                                                                    day: el as WeekDay,
                                                                    operator:
                                                                        operator,
                                                                }
                                                            );
                                                            handleOpenOperatorBenchPinMenu(
                                                                e
                                                            );
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <TableCell key={_idx} />
                                            )
                                    )}
                                </TableRow>
                            )
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <SchedulePickInChargeOperatorMenu
                anchorEl={personInChargeMenuAnchorEl}
                handleClose={handleClosePersonInChargeMenu}
                data={selectedPersonInCharge}
            />
            <SchedulePickOperatorBenchPinMenu
                anchorEl={operatorBenchPinMenuAnchorEl}
                handleClose={handleCloseOperatorBenchPinMenu}
                data={selectedOperator}
            />
            <Box
                display="flex"
                flexDirection="row-reverse"
                justifyContent="space-between"
            >
                <Button
                    variant="contained"
                    onClick={() => {
                        scheduleWeeksStore.clearCurrentSchedule();
                    }}
                >
                    {"Clear"}
                </Button>
                <Button
                    variant="contained"
                    onClick={() => {
                        const timer = setInterval(() => {
                            setProgress((prevProgress) =>
                                //prevProgress >= 100 ? 0 : prevProgress + 10
                                prevProgress == 0 ? 10 : prevProgress + 10
                            );
                        }, 1000);

                        scheduleWeeksStore.refreshSchedule(
                            benchNames,
                            operatorQualificationsStore.operators,
                            () => {
                                clearInterval(timer);
                                setProgress(0);
                            }
                        );
                    }}
                    disabled={
                        useSchedulerErrorStore().getCriticalErrors().length > 0
                    }
                >
                    {"Generate"}
                    <CircularProgress
                        variant="determinate"
                        color="inherit"
                        size="20px"
                        value={progress}
                    />
                </Button>
            </Box>
        </Box>
    );
}

function SchedulePickInChargeOperatorMenu({
    anchorEl,
    handleClose,
    data,
}: {
    anchorEl: null | HTMLElement;
    handleClose: () => any;
    data: null | { day: WeekDay; operator: Operator | null };
}) {
    const operatorQualificationsStore =
        useOperatorQualificationsAndScheduleStore();

    const handleChoosePersonInCharge = (operator: Operator) => {
        if (!operator.daysInCharge) operator.daysInCharge = new Set();

        if (anchorEl && data) {
            if (operator.daysInCharge.has(data.day)) {
                operatorQualificationsStore.setOperatorInChargeDays(
                    operator.name,
                    [
                        ...Array.from(operator.daysInCharge).filter(
                            (d) => d != data.day
                        ),
                    ]
                );
            } else {
                operatorQualificationsStore.setOperatorInChargeDays(
                    operator.name,
                    [...Array.from(operator.daysInCharge), data.day]
                );
            }
            handleClose();
        }
    };

    return (
        <Menu
            anchorEl={anchorEl}
            open={!!anchorEl}
            onClose={handleClose}
            id="schedule-person-incharge-menu"
        >
            {data
                ? operatorQualificationsStore.operators
                      .filter(
                          (operator) =>
                              operator.canFloat &&
                              !!anchorEl &&
                              operator.schedule.has(data.day)
                      )
                      .map((operator, idx) => {
                          return (
                              <MenuItem
                                  key={idx}
                                  onClick={() =>
                                      handleChoosePersonInCharge(operator)
                                  }
                              >
                                  <ListItemIcon>
                                      {anchorEl &&
                                      operator.daysInCharge.has(data.day) ? (
                                          <CheckIcon fontSize="small" />
                                      ) : (
                                          ""
                                      )}
                                  </ListItemIcon>
                                  <ListItemText>{operator.name}</ListItemText>
                              </MenuItem>
                          );
                      })
                : ""}
        </Menu>
    );
}

function SchedulePickOperatorBenchPinMenu({
    anchorEl,
    handleClose,
    data,
}: {
    anchorEl: null | HTMLElement;
    handleClose: () => any;
    data: null | { day: WeekDay; operator: Operator };
}) {
    const scheduleWeeksStore = useScheduleWeeksStore();
    const relatedPin = scheduleWeeksStore.pins.find((p) => {
        if (data && p.operator == data.operator.name && p.day == data.day) {
            return p;
        }
    });

    const onChooseBench = (bench: string) => {
        const existingPin = scheduleWeeksStore.pins.find(
            (p) =>
                p.bench === bench &&
                p.operator === data?.operator?.name &&
                p.day === data.day
        );

        if (data?.operator && data.day && bench) {
            if (existingPin) {
                if (bench == "NONE" || bench == existingPin.bench) {
                    if (data.operator.qualifications.size == 1) {
                        console.log(
                            "this pin cannot be removed because the operator has only one qualification"
                        );
                        setDeleteConfirmToastOpen(true);
                    } else {
                        scheduleWeeksStore.removePinnedAssignment(
                            data.day,
                            data.operator.name
                        );
                    }
                } else {
                    scheduleWeeksStore.addPinnedAssignment(
                        data.day,
                        data.operator.name,
                        bench,
                        data.operator.shift
                    );
                }
            } else {
                scheduleWeeksStore.addPinnedAssignment(
                    data.day,
                    data.operator.name,
                    bench,
                    data.operator.shift
                );
            }
            handleClose();
        }
    };

    const [deleteConfirmToastOpen, setDeleteConfirmToastOpen] = useState(false);

    const handleCloseSnackbar = (
        event: React.SyntheticEvent | Event,
        reason?: string
    ) => {
        if (reason === "clickaway") {
            return;
        }
        setDeleteConfirmToastOpen(false);
    };

    return (
        <>
            <Menu
                id="schedule-set-operator-bench-pin-menu"
                anchorEl={anchorEl}
                open={!!anchorEl}
                onClose={handleClose}
            >
                {(data && data.operator.canFloat
                    ? [
                          ...(Array.from(data?.operator?.qualifications) || []),
                          "Float",
                      ]
                    : Array.from(data?.operator?.qualifications || [])
                ).map((b, idx) => (
                    <MenuItem key={idx} onClick={() => onChooseBench(b)}>
                        <ListItemIcon>
                            {relatedPin && relatedPin.bench === b ? (
                                <PushPinIcon fontSize="small" />
                            ) : (
                                <></>
                            )}
                        </ListItemIcon>
                        <ListItemText>{b}</ListItemText>
                    </MenuItem>
                ))}
            </Menu>
            <Snackbar
                open={deleteConfirmToastOpen}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                message="Operator has one qualification. Cannot remove pin."
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                TransitionComponent={Slide}
            />
        </>
    );
}

function PinnedAssignmentsView() {
    const pinnedAssignmentStore = useScheduleWeeksStore();

    const clearPins = () => {
        pinnedAssignmentStore.clearPins();
    };

    return (
        <Box>
            <Title>Pins Summary</Title>
            <TableContainer sx={{ minHeight: "220px" }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            {["Operator", "Bench", "Day", "Shift"].map(
                                (header, idx) => (
                                    <TableCell key={idx}>{header}</TableCell>
                                )
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {pinnedAssignmentStore.pins.map((pin, idx) => (
                            <TableRow key={idx}>
                                <TableCell>{pin.operator}</TableCell>
                                <TableCell>{pin.bench}</TableCell>
                                <TableCell>{pin.day}</TableCell>
                                <TableCell>
                                    {shiftToString(pin.shift)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Box
                display="flex"
                flexDirection="row"
                justifyContent="space-between"
            >
                <Button variant="contained" onClick={clearPins}>
                    {"Clear"}
                </Button>
            </Box>
        </Box>
    );
}

function BenchAssignmentView({
    operator,
    bench,
    day,
    onClick,
}: {
    operator: Operator;
    bench?: Bench;
    day: WeekDay;
    onClick: (e: React.MouseEvent<HTMLDivElement>) => any;
}) {
    const pinnedAssignmentStore = useScheduleWeeksStore();

    const [isHovering, setIsHovering] = useState(false);

    const handleMouseEnter = () => {
        setIsHovering(true);
    };

    const handleMouseLeave = () => {
        setIsHovering(false);
    };

    const relatedPin: BenchPin | undefined = pinnedAssignmentStore.pins.find(
        (p) =>
            p.bench === bench?.name &&
            p.day === day &&
            p.operator === operator.name
    );

    const scheduleTableViewOptionsStore = useScheduleTableViewOptionsStore();

    const getBenchName = (): string | React.ReactNode => {
        if (!bench) {
            if (operator.schedule.has(day)) {
                if (operator.canFloat && operator.daysInCharge.has(day)) {
                    return "Float";
                } else if (scheduleTableViewOptionsStore.showEmptySlots) {
                    return "EMPTY";
                } else {
                    return "";
                }
            } else if (scheduleTableViewOptionsStore.showOperatorsOff) {
                return <em style={{ color: "#606060" }}>OFF</em>;
            } else {
                return "";
            }
        } else {
            return (
                <Box
                    display={"flex"}
                    flexDirection={"row"}
                    alignContent={"center"}
                    alignItems={"center"}
                >
                    <Box flex={"1 1 auto"} justifyContent={"center"}>
                        {bench.name}
                        {operator.shift.size == 1 &&
                        scheduleTableViewOptionsStore.showHalfShifts ? (
                            operator.shift.has("FIRST_HALF") ? (
                                //@ts-ignore
                                <LightModeIcon fontSize="tiny" />
                            ) : (
                                //@ts-ignore
                                <DarkModeIcon fontSize="tiny" />
                            )
                        ) : (
                            ""
                        )}
                    </Box>
                    <Box alignSelf={"flex-end"}>
                        {
                            //@ts-ignore
                            relatedPin ? <PushPinIcon fontSize="tiny" /> : <></>
                        }
                    </Box>
                </Box>
            );
        }
    };

    return (
        <TableCell
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            sx={{
                backgroundColor:
                    isHovering && operator.schedule.has(day)
                        ? "#424242"
                        : "rgba(0,0,0,0)",
                cursor:
                    isHovering && operator.schedule.has(day)
                        ? "pointer"
                        : "default",
            }}
            onClick={(e) => onClick(e)}
        >
            {getBenchName()}
        </TableCell>
    );
}

function BenchAssignmentMenuRootButton({
    children,
    onChooseBench,
    pin,
    operator,
}: {
    children: React.ReactNode;
    onChooseBench: (benchName: string) => any;
    pin?: BenchPin;
    operator: Operator;
}) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        setAnchorEl(e.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <Box>
            <Box
                onClick={(e) => handleClick(e)}
                sx={{
                    cursor: "pointer",
                }}
            >
                {children}
            </Box>
            <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
            >
                {(operator.canFloat
                    ? [...Array.from(operator.qualifications), "Float"]
                    : Array.from(operator.qualifications)
                ).map((b, idx) => (
                    <MenuItem key={idx} onClick={() => onChooseBench(b)}>
                        <ListItemIcon>
                            {pin && pin.bench === b ? (
                                <PushPinIcon fontSize="small" />
                            ) : (
                                <></>
                            )}
                        </ListItemIcon>
                        <ListItemText>{b}</ListItemText>
                    </MenuItem>
                ))}
            </Menu>
        </Box>
    );
}

function BenchNamesView() {
    const benchNamesStore = useBenchNamesStore();

    const [newBenchName, setNewBenchName] = useState("");

    const [benchDisableEnableMenuAnchorEl, setBenchDisableEnableMenuAnchorEl] =
        useState<null | HTMLElement>(null);

    const [benchDisableEnableMenuData, setBenchDisableEnableMenuData] =
        useState<null | { bench: string; day: WeekDay; enabled: boolean }>(
            null
        );

    const handleCloseBenchDisableEnableMenu = () => {
        setBenchDisableEnableMenuAnchorEl(null);
        setBenchDisableEnableMenuData(null);
    };

    return (
        <div>
            <Title>Benches</Title>

            <TableContainer component={"form"}>
                <Table size="small" sx={{ marginBottom: 10 }}>
                    <TableHead>
                        <TableRow>
                            <TableCell>Bench name</TableCell>
                            {weekdays.map((weekday, idx) => (
                                <TableCell key={idx}>{weekday}</TableCell>
                            ))}
                            <TableCell></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {benchNamesStore.names.map((name) => (
                            <BenchNameDetailView key={name.name} bench={name} />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <BenchDisableEnableForDayMenu
                anchorEl={benchDisableEnableMenuAnchorEl}
                handleClose={handleCloseBenchDisableEnableMenu}
                data={benchDisableEnableMenuData}
            />

            <TextField
                variant="outlined"
                size="small"
                label="Add bench name"
                value={newBenchName}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setNewBenchName(event.target.value);
                }}
                onKeyDown={(event: React.KeyboardEvent) => {
                    if (event.key === "Enter") {
                        benchNamesStore.addName(newBenchName);
                        setNewBenchName("");
                    }
                }}
            />
        </div>
    );
}

function BenchNameDetailView({ bench }: { bench: Bench }) {
    const benchNamesStore = useBenchNamesStore();

    const handleDelete = () => {
        benchNamesStore.removeName(bench.name);
    };

    const handleSetDays = (days: WeekDay[]) => {
        benchNamesStore.setDaysPresent(bench.name, days);
    };

    const onChangeBenchName = (name: string) => {
        benchNamesStore.setName(bench.name, name);
    };

    const [benchNameState, setBenchNameState] = useState<string>(bench.name);
    const [isFocus, setIsFocus] = useState<boolean>(false);
    const onCloseBenchName = (event: React.FormEvent) => {
        if (benchNameState != "") {
            onChangeBenchName(benchNameState);
            setIsFocus(false);
        } else {
            event.preventDefault();
            event.stopPropagation();
        }
    };

    const onChangeAssignmentMode = (
        event: Event,
        newValue: number | number[]
    ) => {};

    const benchErrors = useSchedulerErrorStore();

    return (
        <TableRow>
            <TableCell>
                <TextField
                    error={benchNameState === ""}
                    focused={isFocus}
                    variant="standard"
                    size="small"
                    value={benchNameState}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        setBenchNameState(event.target.value);
                    }}
                    onFocus={() => setIsFocus(true)}
                    onBlur={(event: React.FocusEvent) => {
                        onCloseBenchName(event);
                    }}
                    onKeyDown={(event: React.KeyboardEvent) => {
                        if (event.key === "Enter") {
                            onCloseBenchName(event);
                        }
                    }}
                />
                {benchErrors.getErrorsForBench(bench.name).length > 0 ? (
                    <Tooltip
                        title={benchErrors
                            .getErrorsForBench(bench.name)
                            .map((err) => err.message + " ")}
                        color="warning"
                    >
                        <Icon>
                            <ReportProblemIcon />
                        </Icon>
                    </Tooltip>
                ) : (
                    <></>
                )}
            </TableCell>
            {weekdays.map((weekday, idx) => (
                <TableCell key={idx}>
                    {/*
                    <Slider
                    valueLabelDisplay="auto"
                    valueLabelFormat={(val) =>
                        val == 0
                            ? "Off"
                            : val == 1
                            ? "Optional"
                            : "Required"
                    }
                    step={1}
                    value={
                        bench.daysRequired.has(weekday)
                            ? 2
                            : bench.daysPresent.has(weekday)
                            ? 1
                            : 0
                    }
                    min={0}
                    max={2}
                    onChange={(
                        event: Event,
                        newValue: number | number[]
                    ) => {
                        if (newValue == 0) {
                            benchNamesStore.removeDaysPresent(bench.name, [
                                weekday,
                            ]);
                        } else if (newValue == 1) {
                            benchNamesStore.addDaysPresent(bench.name, [
                                weekday,
                            ]);
                            benchNamesStore.removeDaysRequired(bench.name, [
                                weekday,
                            ]);
                        } else if (newValue == 2) {
                            benchNamesStore.addDaysRequired(bench.name, [
                                weekday,
                            ]);
                        }
                    }}
                    //@ts-ignore
                    color={
                        bench.daysRequired.has(weekday)
                            ? "info"
                            : bench.daysPresent.has(weekday)
                            ? "primary"
                            : "#ff0000"
                    }
                />
                    */}
                    <Select
                        style={{
                            backgroundColor: bench.daysRequired.has(weekday)
                                ? "#ab003c"
                                : bench.daysPresent.has(weekday)
                                ? "#2196f3"
                                : "",
                        }}
                        size="small"
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        value={
                            (bench.daysRequired.has(weekday)
                                ? 2
                                : bench.daysPresent.has(weekday)
                                ? 1
                                : 0) + ""
                        }
                        label=""
                        onChange={(event: SelectChangeEvent) => {
                            const newValue = parseInt(event.target.value);
                            if (newValue == 0) {
                                benchNamesStore.removeDaysPresent(bench.name, [
                                    weekday,
                                ]);
                            } else if (newValue == 1) {
                                benchNamesStore.addDaysPresent(bench.name, [
                                    weekday,
                                ]);
                                benchNamesStore.removeDaysRequired(bench.name, [
                                    weekday,
                                ]);
                            } else if (newValue == 2) {
                                benchNamesStore.addDaysRequired(bench.name, [
                                    weekday,
                                ]);
                            }
                        }}
                    >
                        <MenuItem value={0}>Off</MenuItem>
                        <MenuItem value={1}>Opt.</MenuItem>
                        <MenuItem value={2}>Req.</MenuItem>
                    </Select>
                </TableCell>
            ))}
            <TableCell onClick={() => handleDelete()}>
                <DeleteIcon sx={{ cursor: "pointer" }} />
            </TableCell>
            {/*<TableCell>
                <Switch
                    checked={
                        benchNamesStore.names.find((n) => n.name === benchName)
                            ?.isRequired || false
                    }
                    onChange={() =>
                        benchNamesStore.toggleBenchRequired(benchName)
                    }
                />
            </TableCell>*/}
        </TableRow>
    );
}

function BenchDisableEnableForDayMenu({
    anchorEl,
    handleClose,
    data,
}: {
    anchorEl: null | HTMLElement;
    handleClose: () => any;
    data: null | { bench: string; day: WeekDay; enabled: boolean };
}) {
    const onDisableEnable = () => {};

    return (
        <Menu
            id="bench-disable-enable-menu"
            anchorEl={anchorEl}
            open={!!anchorEl}
            onClose={handleClose}
        >
            <MenuItem onClick={() => onDisableEnable()}>
                <ListItemText>
                    {data ? (data.enabled ? "Disable" : "Enable") : "error"}
                </ListItemText>
            </MenuItem>
        </Menu>
    );
}

function OperatorNamesView() {
    const operatorQualificationsStore =
        useOperatorQualificationsAndScheduleStore();

    const benchNamesStore = useBenchNamesStore();

    const [newOperatorName, setNewOperatorName] = useState("");

    const [dayFilter, setDaysFilter] = useState<WeekDay | "">("");
    const [benchesFilter, setBenchesFilter] = useState<string[]>([]);

    const handleDayFilter = (weekday: WeekDay) => {
        if (dayFilter == weekday) {
            setDaysFilter("");
        } else setDaysFilter(weekday);
    };

    const handleBenchFilter = (bench: string) => {
        if (benchesFilter.includes(bench)) {
            setBenchesFilter(benchesFilter.filter((b) => b !== bench));
        } else {
            setBenchesFilter([...benchesFilter, bench]);
        }
    };

    const [filterSupervisors, setFilterSupervisors] = useState<boolean>(false);

    const [
        operatorNamesViewOptionsMenuAnchorEl,
        setOperatorNamesViewOptionsMenuAnchorEl,
    ] = useState<null | HTMLElement>(null);
    const operatorNamesViewOptionsMenuOpen = Boolean(
        operatorNamesViewOptionsMenuAnchorEl
    );
    const handleOperatorNamesViewOptionsMenuClick = (
        event: React.MouseEvent<HTMLButtonElement>
    ) => {
        setOperatorNamesViewOptionsMenuAnchorEl(event.currentTarget);
    };
    const handleOperatorNamesViewOptionsMenuClose = () => {
        setOperatorNamesViewOptionsMenuAnchorEl(null);
    };

    const [showFilters, setShowFilters] = useState<boolean>(false);

    return (
        <Box sx={{ height: "100%" }}>
            <Box
                display={"flex"}
                flexDirection={"row"}
                justifyContent={"space-between"}
            >
                <Title>Operators</Title>
                <IconButton onClick={handleOperatorNamesViewOptionsMenuClick}>
                    <MenuIcon />
                </IconButton>
                <Menu
                    anchorEl={operatorNamesViewOptionsMenuAnchorEl}
                    open={operatorNamesViewOptionsMenuOpen}
                    onClose={handleOperatorNamesViewOptionsMenuClose}
                >
                    <MenuItem onClick={() => setShowFilters(!showFilters)}>
                        Show filters
                        <Switch
                            checked={showFilters}
                            onChange={() => setShowFilters(!showFilters)}
                        />
                    </MenuItem>
                </Menu>
            </Box>
            <Box>
                <Collapse in={showFilters}>
                    <Box>
                        <Stack
                            direction="row"
                            spacing={1}
                            justifyContent={"center"}
                            flexWrap={"wrap"}
                        >
                            {weekdays.map((weekday) => (
                                <Chip
                                    key={weekday}
                                    label={weekday}
                                    sx={{ cursor: "pointer" }}
                                    onClick={() => handleDayFilter(weekday)}
                                    variant={
                                        dayFilter == weekday
                                            ? "filled"
                                            : "outlined"
                                    }
                                    color="primary"
                                />
                            ))}
                        </Stack>
                        <Stack
                            direction="row"
                            spacing={1}
                            justifyContent={"center"}
                            flexWrap={"wrap"}
                        >
                            {benchNamesStore.names.map((bench, idx) => (
                                <Chip
                                    key={idx}
                                    label={bench.name}
                                    sx={{ cursor: "pointer" }}
                                    onClick={() =>
                                        handleBenchFilter(bench.name)
                                    }
                                    variant={
                                        benchesFilter.includes(bench.name)
                                            ? "filled"
                                            : "outlined"
                                    }
                                    color="primary"
                                />
                            ))}
                        </Stack>
                        <Stack
                            direction={"row"}
                            spacing={1}
                            justifyContent={"center"}
                            flexWrap={"wrap"}
                        >
                            <Chip
                                label="Supervisors"
                                sx={{ cursor: "pointer" }}
                                onClick={() => {
                                    setFilterSupervisors(!filterSupervisors);
                                }}
                                variant={
                                    filterSupervisors ? "filled" : "outlined"
                                }
                                color="primary"
                            />
                        </Stack>
                    </Box>
                </Collapse>
            </Box>

            <Box sx={{ height: "1000px" }}>
                <OperatorNamesTableView
                    operators={operatorQualificationsStore.operators
                        .filter((op) =>
                            dayFilter != "" ? op.schedule.has(dayFilter) : true
                        )
                        .filter((op) =>
                            benchesFilter.length > 0
                                ? benchesFilter.every((v) =>
                                      op.qualifications.has(v)
                                  )
                                : true
                        )
                        .filter((op) =>
                            filterSupervisors ? op.canFloat : true
                        )}
                />
            </Box>
            <Box>
                <TextField
                    variant="outlined"
                    size="small"
                    label="Add operator name"
                    value={newOperatorName}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        setNewOperatorName(event.target.value);
                    }}
                    onKeyDown={(event: React.KeyboardEvent) => {
                        if (event.key === "Enter") {
                            operatorQualificationsStore.addOperator(
                                newOperatorName
                            );
                            setNewOperatorName("");
                        }
                    }}
                />
            </Box>
        </Box>
    );
}

function OperatorNamesTableView({ operators }: { operators: Operator[] }) {
    const operatorQualificationsStore =
        useOperatorQualificationsAndScheduleStore();

    const [movingOperator, setMovingOperator] = useState<Operator | null>(null);

    const onMouseDown = (e: React.MouseEvent, idx: number) => {
        setMovingOperator(operatorQualificationsStore.operators[idx]);
    };
    const onMouseUp = (e: React.MouseEvent, idx: number) => {
        setMovingOperator(null);
    };

    const onMouseEnter = (e: React.MouseEvent, idx: number) => {
        if (e.buttons === 0) {
            setMovingOperator(null);
            return;
        }
        if (movingOperator) {
            operatorQualificationsStore.setOperatorSortIndex(
                movingOperator.name,
                idx
            );
        }
    };

    const onMouseLeaveTable = (e: React.MouseEvent) => {
        setMovingOperator(null);
    };

    const [deleteConfirmToastOpen, setDeleteConfirmToastOpen] = useState(false);

    const handleCloseSnackbar = (
        event: React.SyntheticEvent | Event,
        reason?: string
    ) => {
        if (reason === "clickaway") {
            return;
        }
        setDeleteConfirmToastOpen(false);
        setOperatorToDelete(null);
    };

    const [operatorToDelete, setOperatorToDelete] = useState<null | Operator>(
        null
    );

    const handleDeleteOperator = (operator: Operator) => {
        setOperatorToDelete(operator);
        operatorQualificationsStore.removeOperator(operator.name);
        setDeleteConfirmToastOpen(true);
    };

    const handleRestoreOperator = () => {
        if (operatorToDelete) {
            operatorQualificationsStore.restoreOperator(operatorToDelete);
            setOperatorToDelete(null);
            setDeleteConfirmToastOpen(false);
        }
    };

    const action = (
        <Fragment>
            <Button
                color="primary"
                size="small"
                onClick={handleRestoreOperator}
                variant="contained"
            >
                UNDO
            </Button>
            <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={handleCloseSnackbar}
            >
                <CloseIcon fontSize="small" />
            </IconButton>
        </Fragment>
    );

    return (
        <>
            <TableContainer sx={{ maxHeight: "100%" }}>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell />
                            <TableCell>Name</TableCell>
                            <TableCell>Days</TableCell>
                            <TableCell>Benches</TableCell>
                            <TableCell>Shift</TableCell>
                            <TableCell> </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody onMouseLeave={onMouseLeaveTable}>
                        {operators.map((operator, idx) => (
                            <OperatorDetailView
                                key={idx}
                                operator={operator}
                                idx={idx}
                                onDeleteOperator={() =>
                                    handleDeleteOperator(operator)
                                }
                                onMouseDown={(e, idx) => onMouseDown(e, idx)}
                                onMouseUp={(e, idx) => onMouseUp(e, idx)}
                                onMouseEnter={(e, idx) => onMouseEnter(e, idx)}
                                isDragging={
                                    movingOperator
                                        ? movingOperator.name === operator.name
                                        : false
                                }
                            />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Snackbar
                open={deleteConfirmToastOpen}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                message="Operator deleted."
                action={action}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                TransitionComponent={Slide}
            />
        </>
    );
}

function OperatorDetailView({
    operator,
    idx,
    onDeleteOperator,
    onMouseDown,
    onMouseUp,
    onMouseEnter,
    isDragging,
}: {
    operator: Operator;
    idx: number;
    onDeleteOperator: () => any;
    onMouseDown: (e: React.MouseEvent, idx: number) => any;
    onMouseUp: (e: React.MouseEvent, idx: number) => any;
    onMouseEnter: (e: React.MouseEvent, idx: number) => any;
    isDragging: boolean;
}) {
    const benchNames = useBenchNamesStore((b) => b.names);
    const operatorQualificationsStore =
        useOperatorQualificationsAndScheduleStore();

    const handleSetDays = (days: WeekDay[]) => {
        operatorQualificationsStore.setWorkingDaysForOperator(
            operator.name,
            days
        );
    };

    const handleSetQualifications = (qualifications: string[]) => {
        operatorQualificationsStore.setQualificationsForOperator(
            operator.name,
            qualifications
        );
    };

    const handleSetShifts = (shifts: ShiftType[]) => {
        operatorQualificationsStore.setOperatorShift(operator.name, shifts);
    };

    const handleMouseMove: MouseEventHandler<HTMLDivElement> = (e) => {
        if (e.stopPropagation) e.stopPropagation();
        if (e.preventDefault) e.preventDefault();
    };

    const schedulerErrors = useSchedulerErrorStore();
    const operatorErrors = schedulerErrors.getErrorsForOperator(operator.name);

    return (
        <TableRow
            hover={!isDragging}
            sx={isDragging ? { backgroundColor: "#3f51b5" } : {}}
            onMouseEnter={(e) => onMouseEnter(e, idx)}
            onMouseUp={(e) => onMouseUp(e, idx)}
        >
            <TableCell
                onMouseDown={(e) => onMouseDown(e, idx)}
                onMouseMove={handleMouseMove}
                onDrag={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
                sx={{ cursor: "grab" }}
            >
                <DragHandleIcon />{" "}
            </TableCell>
            <TableCell component="th" scope="row" sx={{ minWidth: "140px" }}>
                <Stack
                    direction={"row"}
                    spacing={1}
                    alignItems={"center"}
                    justifyContent={"space-between"}
                >
                    {operator.name}
                    <Box>
                        {operator.canFloat ? (
                            <Chip size="small" label="Float" color="primary" />
                        ) : (
                            <></>
                        )}
                        {operatorErrors.length > 0 ? (
                            <Tooltip
                                title={operatorErrors.map(
                                    (err) => err.message + " "
                                )}
                                color="warning"
                            >
                                <Icon>
                                    <ReportProblemIcon />
                                </Icon>
                            </Tooltip>
                        ) : (
                            <></>
                        )}
                    </Box>
                </Stack>
            </TableCell>
            <TableCell>
                <OperatorDetailEditMenu<WeekDay>
                    content={Array.from(operator.schedule)
                        .sort((a, b) =>
                            weekdays.indexOf(a) < weekdays.indexOf(b)
                                ? -1
                                : weekdays.indexOf(a) > weekdays.indexOf(b)
                                ? 1
                                : 0
                        )
                        .map((s) => s)}
                    menuOptions={weekdays.map((s) => ({
                        display: weekdayToString(s),
                        value: s,
                        checked: operator.schedule.has(s),
                    }))}
                    handleChoose={(e) =>
                        handleSetDays(
                            e
                                .filter((ent) => ent.checked)
                                .map((ent) => ent.value)
                        )
                    }
                    isMultiSelect
                />
            </TableCell>
            <TableCell>
                <OperatorDetailEditMenu<string>
                    content={Array.from(operator.qualifications)}
                    menuOptions={benchNames.map((b) => ({
                        display: b.name,
                        value: b.name,
                        checked: operator.qualifications.has(b.name),
                    }))}
                    handleChoose={(e) =>
                        handleSetQualifications(
                            e
                                .filter((ent) => ent.checked)
                                .map((ent) => ent.value)
                        )
                    }
                    isMultiSelect
                    additionalOptions={[
                        {
                            name: "Float",
                            isChecked: operator.canFloat || false,
                            cb: () => {
                                operatorQualificationsStore.setCanFloatForOperator(
                                    operator.name,
                                    !operator.canFloat
                                );
                            },
                            isDisabled: !benchNames
                                .map((b) => b.name)
                                .every((b) => operator.qualifications.has(b)),
                        },
                    ]}
                />
            </TableCell>
            <TableCell>
                <OperatorDetailEditMenu<ShiftType>
                    content={[shiftToString(operator.shift)]}
                    menuOptions={[
                        {
                            display: "First Half",
                            value: "FIRST_HALF",
                            checked: operator.shift.has("FIRST_HALF"),
                        },
                        {
                            display: "Second Half",
                            value: "SECOND_HALF",
                            checked: operator.shift.has("SECOND_HALF"),
                        },
                    ]}
                    handleChoose={(e) =>
                        handleSetShifts(
                            e
                                .filter((ent) => ent.checked)
                                .map((ent) => ent.value)
                        )
                    }
                    isMultiSelect
                />
            </TableCell>
            <TableCell onClick={() => onDeleteOperator()}>
                <DeleteIcon sx={{ cursor: "pointer" }} />
            </TableCell>
        </TableRow>
    );
}

function OperatorDetailEditMenu<T>({
    content,
    displayContentAs = "STRING",
    menuOptions,
    handleChoose,
    isMultiSelect = false,
    additionalOptions,
    icon = null,
}: {
    content: string[];
    displayContentAs?: "LIST" | "STRING";
    menuOptions: { display: string; value: T; checked: boolean }[];
    handleChoose: (e: { display: string; value: T; checked: boolean }[]) => any;
    isMultiSelect?: boolean;
    additionalOptions?: {
        name: string;
        isChecked: boolean;
        cb: () => any;
        isDisabled: boolean;
    }[];
    icon?: React.ReactNode;
}) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        setAnchorEl(e.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleClickItem = (
        b: { display: string; value: T; checked: boolean },
        idx: number
    ) => {
        menuOptions[idx].checked = !menuOptions[idx].checked;
        handleChoose(menuOptions);
    };

    const handleClickRemoveAll = () => {
        menuOptions.map((o) => (o.checked = false));
        handleChoose(menuOptions);
    };

    const handleClickAddAll = () => {
        menuOptions.map((o) => (o.checked = true));
        handleChoose(menuOptions);
    };

    return (
        <Box sx={{ cursor: "pointer", minHeight: "42px" }}>
            <div onClick={(e) => handleClick(e)} style={{ minHeight: "42px" }}>
                {icon
                    ? icon
                    : displayContentAs == "STRING"
                    ? content.join(", ")
                    : content.map((c, idx) => <div key={idx}>{c}</div>)}
            </div>
            <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
            >
                {menuOptions.map((b, idx) => (
                    <MenuItem
                        key={idx}
                        onClick={(e) => handleClickItem(b, idx)}
                    >
                        <ListItemIcon>
                            {b.checked ? <CheckIcon fontSize="small" /> : <></>}
                        </ListItemIcon>
                        <ListItemText>{b.display}</ListItemText>
                    </MenuItem>
                ))}
                {!!additionalOptions && additionalOptions.length > 0 ? (
                    <Divider />
                ) : (
                    ""
                )}
                {!!additionalOptions && additionalOptions.length > 0
                    ? additionalOptions?.map((option, idx) => {
                          return (
                              <MenuItem
                                  key={idx}
                                  onClick={option.cb}
                                  disabled={option.isDisabled}
                              >
                                  <ListItemIcon>
                                      {option.isChecked ? (
                                          <CheckIcon fontSize="small" />
                                      ) : (
                                          <></>
                                      )}
                                  </ListItemIcon>
                                  <ListItemText>{option.name}</ListItemText>
                              </MenuItem>
                          );
                      })
                    : ""}
                {isMultiSelect ? <Divider /> : ""}
                {isMultiSelect ? (
                    menuOptions.every((m) => m.checked) ? (
                        <MenuItem onClick={() => handleClickRemoveAll()}>
                            <ListItemIcon>
                                <Remove fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>
                                <em>Remove all</em>
                            </ListItemText>
                        </MenuItem>
                    ) : (
                        <MenuItem onClick={() => handleClickAddAll()}>
                            <ListItemIcon>
                                <Add fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>
                                <em>Add all</em>
                            </ListItemText>
                        </MenuItem>
                    )
                ) : (
                    ""
                )}
            </Menu>
        </Box>
    );
}

function EditableDetailViewTextCell({
    content,
    onSetValue,
}: {
    content: string;
    onSetValue: (newValue: string) => any;
}) {
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [fieldValue, setFieldValue] = useState<string>("");

    const onClickText = () => {
        setFieldValue(content);
        setIsEditing(true);
    };

    const onClose = () => {
        if (fieldValue != "") {
            onSetValue(fieldValue);
            setIsEditing(false);
            setFieldValue("");
        }
    };

    return (
        <>
            {isEditing ? (
                <TextField
                    focused
                    variant="standard"
                    size="small"
                    label="Bench name"
                    value={fieldValue}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        setFieldValue(event.target.value);
                    }}
                    onBlur={(event: React.FocusEvent) => onClose()}
                    onKeyDown={(event: React.KeyboardEvent) => {
                        if (event.key === "Enter") {
                            onClose();
                        }
                    }}
                />
            ) : (
                <Box onClick={onClickText}>{content}</Box>
            )}
        </>
    );
}

function DeleteConfirmationSnackbar() {
    const [open, setOpen] = useState(false);

    const handleClick = () => {
        setOpen(true);
    };

    const handleClose = (
        event: React.SyntheticEvent | Event,
        reason?: string
    ) => {
        if (reason === "clickaway") {
            return;
        }

        setOpen(false);
    };

    const action = (
        <Fragment>
            <Button color="secondary" size="small" onClick={handleClose}>
                UNDO
            </Button>
            <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={handleClose}
            >
                <CloseIcon fontSize="small" />
            </IconButton>
        </Fragment>
    );

    return (
        <div>
            <Button onClick={handleClick}>Open Snackbar</Button>
            <Snackbar
                open={open}
                autoHideDuration={6000}
                onClose={handleClose}
                message="Note archived"
                action={action}
            />
        </div>
    );
}
