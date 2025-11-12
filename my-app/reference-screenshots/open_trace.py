import phoenix as px
from phoenix.trace.utils import json_lines_to_df

with open('trace.jsonl', 'r') as f:
    df = json_lines_to_df(f.readlines())

px.launch_app(trace=px.TraceDataset(df))