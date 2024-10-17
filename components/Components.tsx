import * as React from "react";
import Typography from "@mui/material/Typography";

interface TitleProps {
    children?: React.ReactNode;
}

export function Title(props: TitleProps) {
    return (
        <Typography component="h2" variant="h6" color="primary" gutterBottom>
            {props.children}
        </Typography>
    );
}

export function SubTitle(props: TitleProps) {
    return (
        <Typography color="text.secondary" sx={{ flex: 1 }}>
            {props.children}
        </Typography>
    );
}
