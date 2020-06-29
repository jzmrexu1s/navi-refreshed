nice = [0, 1, 2]
priority = [0, 0, 0]
PRI_MAX = 63
PRI_MIN = 0

ticks = 0
load_avg = 0.05
recent_cpu = [0, 0, 0]
running = None
ready = [0, 1, 2]

while ticks <= 36:
    if running is not None:
        recent_cpu[running] = recent_cpu[running] + 1
    if ticks % 100 == 0:
        pass
    if ticks % 4 == 0:
        print("ticks: ", ticks, " recent_cpu: ", recent_cpu, end=' ')
        priority = [PRI_MAX - (recent_cpu[i] / 4) - (nice[i] * 2) for i in range(0, 3)]
        for i in range(0, 2):
            if priority[i] > PRI_MAX:
                priority[i] = PRI_MAX
            if priority[i] < PRI_MIN:
                priority[i] = PRI_MIN
        print("priority: ", priority, end=' ')
        print("to run:", priority.index(max(priority)))
        running = priority.index(max(priority))
    ticks += 1
