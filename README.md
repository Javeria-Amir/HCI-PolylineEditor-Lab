#  HCI Mid Lab – Polyline Editor

##  Introduction  
This project is developed as part of the **Human-Computer Interaction (HCI) Mid Lab**.  
The objective was to apply the design process (Chapter 5) to build an interactive system.

The application allows users to draw, edit, and manipulate polylines using **keyboard and mouse interactions**.

---

##  Design Process (Phase-wise)

- **Phase 1 – Requirement:** Haleema Fatima (B23110006036)  
- **Phase 2 – Analysis:** Aaisha Iqbal (B23110006001)  
- **Phase 3 – Design / Prototype:** Javeria Amir (B23110006049)  
- **Phase 4 – Implementation (Code + Deployment):** Minal Shahid (B23110006067)  

---

##  System Functionality  

###  Controls

| Key | Action | Description |
|-----|--------|------------|
| **B** | Begin | Start creating a new polyline |
| **D** | Delete | Remove the closest point |
| **M** | Move | Drag a point to a new location |
| **R** | Refresh | Redraw all polylines |
| **Q** | Quit | Clear the canvas |
| **Ctrl + Z** | Undo | Undo last action |
| **Ctrl + Y** | Redo | Redo last undone action |

---

###  Interaction Details  

- **Begin Mode (B):** Click to add points and form a polyline  
- **Delete Mode (D):** Removes the closest vertex  
- **Move Mode (M):** Drag a point to update its position  
- **Refresh (R):** Re-renders all polylines  
- **Undo/Redo:** Restores previous states  
- **Scribble (Extra):** Freehand drawing  

---

##  Data Structures Used  

### Polylines Array
```ts
polylines: {
  id: string,
  points: number[], // [x1, y1, x2, y2, ...]
  color: string
}[]

scribbles: {
  id: string,
  points: number[],
  color: string
}[]

history: {
  scribbles: Scribble[],
  polylines: Polyline[]
}[]
```
### Snapshot of the deployed site
<img width="1916" height="907" alt="image" src="https://github.com/user-attachments/assets/3450dea5-c020-437c-b48f-db3724bd0010" />


###  Challenges and Confusions 
- 
- 
- 

###  How to Run
- git clone https://github.com/minalDev-git/HCI-Mid-Lab.git
- cd HCI-Mid-Lab
- npm install
- npm run dev
