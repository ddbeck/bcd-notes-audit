#!/usr/bin/env fish

for report in statements notes
    npx tsx ./src/cli.mts $report >~/Downloads/(date +%Y-%m-%d)_$report.tsv
end
