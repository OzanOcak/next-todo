"use client";

import { Task } from "@/types/task";
import { Checkbox } from "./ui/checkbox";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { dataProps, updateTask } from "@/actions/update-tasks";
import completeTask from "@/actions/complete-tasks";
import { Button } from "./ui/button";
import { StarFilledIcon } from "@radix-ui/react-icons";
import { StarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  tasks: Task[];
  accentClassName: string;
};
type dataTitleProp = Pick<dataProps, "title">;
type dataNoteProp = Pick<dataProps, "note">;

export default function TaskList({ tasks, accentClassName }: Props) {
  async function checkTask(task: Task) {
    await completeTask(task.id, !task.isComplete);
  }

  async function updateTitle(task: Task, title: string) {
    const data: dataTitleProp = {
      title: title,
    };
    await updateTask(task.id, data);
  }

  async function updateNote(task: Task, note: string) {
    const data: dataNoteProp = {
      note: note,
    };
    await updateTask(task.id, data);
  }

  async function toggleImportant(task: Task) {
    const data = {
      isImportant: !task.isImportant,
    };
    await updateTask(task.id, data);
  }

  return (
    <div>
      {tasks.map((task) => (
        <div
          key={task.id}
          className="bg-accent mb-0.5 rounded text-foreground flex items-center"
        >
          <div className="p-3">
            <Checkbox
              checked={task.isComplete ? true : false}
              onClick={() => checkTask(task)}
            />
          </div>
          <div className="flex-auto">
            <Drawer>
              <DrawerTrigger
                className={cn(
                  "w-full text-left p-3",
                  task.isComplete && "line-through text-muted-foreground"
                )}
              >
                {task.title}
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Edit Task</DrawerTitle>
                </DrawerHeader>
                <div className="p-5 flex flex-col gap-5">
                  <Input
                    type="text"
                    name="title"
                    defaultValue={task.title ?? ""}
                    onChange={(e) => updateTitle(task, e.target.value)}
                  />
                  <Textarea
                    placeholder="Add note"
                    name="note"
                    defaultValue={task.note ?? ""}
                    onChange={(e) => updateNote(task, e.target.value)}
                  />
                </div>
              </DrawerContent>
            </Drawer>
          </div>
          <Button
            className={cn(accentClassName, `hover:${accentClassName}`)}
            variant="ghost"
            onClick={() => toggleImportant(task)}
          >
            {task.isImportant ? (
              <StarFilledIcon className="w-6 h-6" />
            ) : (
              <StarIcon className="w-6 h-6" />
            )}
          </Button>
        </div>
      ))}
    </div>
  );
}
