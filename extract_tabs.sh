#!/bin/bash

# Extract WheelBuilderTab (lines 327-684)
echo 'import { Loader } from "../common/Loader"
import { NumberChip } from "../common/NumberChip"
import { StatCard } from "../common/StatCard"
import { PaginationControls } from "../common/PaginationControls"
import { nCk, findMinimumCovering } from "../../utils/combinatorics"
import { formatNumbers, toCSV } from "../../utils/formatters"

export ' > src/components/tabs/WheelBuilderTab.jsx
sed -n '327,684p' src/App.jsx.backup >> src/components/tabs/WheelBuilderTab.jsx

# Extract CoverageAnalysisTab (lines 686-1076)
echo 'import { Loader } from "../common/Loader"
import { NumberChip } from "../common/NumberChip"
import { StatCard } from "../common/StatCard"
import { PaginationControls } from "../common/PaginationControls"
import { nCk, findMinimumCovering } from "../../utils/combinatorics"
import { formatNumbers, toCSV } from "../../utils/formatters"

export ' > src/components/tabs/CoverageAnalysisTab.jsx
sed -n '686,1076p' src/App.jsx.backup >> src/components/tabs/CoverageAnalysisTab.jsx

echo "Files extracted successfully!"
