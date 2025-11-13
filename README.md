![Trace Taxi](https://raw.githubusercontent.com/thomasahle/trace-taxi/refs/heads/main/public/trace-taxi.png)

I was working with benchmarking agents using terminal-bench, and I often found myself with a bunch of log files with agent input/outputs that I needed to read.

instead of adding observability and langfuse etc. to everything, I just wanted a simple tool to visualize the trace files, but nothing existed.

so I build https://trace.taxi which allows up to "upload" (well, it's serverless, so everything stays in your browser) your trace file and have it visualized as well as I can manage.

I tested mostly with my own logs from ~/.claude/projects/, so it's possible you'll be able to break it. Let me know if you do!
