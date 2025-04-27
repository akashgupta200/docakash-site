// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAeFlocgrge6f8fWEwrXdJdOav4vMoVZmY",
  authDomain: "docakash-a8e32.firebaseapp.com",
  projectId: "docakash-a8e32",
  storageBucket: "docakash-a8e32.firebasestorage.app",
  messagingSenderId: "201648861070",
  appId: "1:201648861070:web:1ea687ed3bb1a95d13bedf",
  measurementId: "G-9R6NGZ4JZB",
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(app);
const auth = firebase.auth(app);

// Google SignIn
const provider = new firebase.auth.GoogleAuthProvider();
auth
  .signInWithPopup(provider)
  .then((result) => {
    console.log("Logged in:", result.user.displayName);
  })
  .catch((error) => {
    console.error("Login failed:", error);
  });

document.getElementById("loginBtn").addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth
    .signInWithPopup(provider)
    .then((result) => {
      document.getElementById("loginBtn").textContent = result.user.displayName;
      loadTopics(); // Load topics after login
    })
    .catch((error) => {
      console.error("Login failed:", error);
      alert("Login failed: " + error.message);
    });
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  auth.signOut().then(() => {
    console.log("User signed out.");
    document.getElementById("loginBtn").textContent = "Login";
    document.getElementById("logoutBtn").classList.add("hidden");
    pageList.innerHTML = "";
    topicsDiv.innerHTML = "";
    pageTitle.value = "";
    quill.root.innerHTML = "";
  });
});

auth.onAuthStateChanged((user) => {
  if (user) {
    document.getElementById(
      "loginBtn"
    ).textContent = `Welcome, ${user.displayName}`;
    document.getElementById("logoutBtn").classList.remove("hidden");
    loadTopics();
  } else {
    document.getElementById("loginBtn").textContent = "Login";
    document.getElementById("logoutBtn").classList.add("hidden");
  }
});

// DOM Elements
const topicsDiv = document.getElementById("topics");
const pageList = document.getElementById("pageList");
const pageTitle = document.getElementById("pageTitle");
const pageContent = document.getElementById("pageContent"); // This is now a DIV
const deleteTopicBtn = document.getElementById("deleteTopicBtn");
const deletePageBtn = document.getElementById("deletePageBtn");
const addPageBtn = document.getElementById("addPageBtn");
const pageSearch = document.getElementById("pageSearch");

const Font = Quill.import("formats/font");
Font.whitelist = [
  "sans-serif",
  "serif",
  "monospace",
  "roboto",
  "open-sans",
  "jetbrains-mono",
  "comic-sans",
  "georgia",
  "arial",
  "times-new-roman",
  "consolas",
];
Quill.register(Font, true);

const Size = Quill.import("attributors/style/size");
Size.whitelist = ["8px", "12px", "16px", "24px", "32px"]; // You can add more
Quill.register(Size, true);

let quill = new Quill("#pageContent", {
  theme: "snow",
  modules: {
    toolbar: {
      container: [
        [{ font: Font.whitelist }],
        //  [{ size: ['8px', '12px', '16px', '24px', '32px'] }], // Remove Quill's default
        [{ header: [1, 2, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ indent: "-1" }, { indent: "+1" }],
        [{ align: [] }],
        ["link", "image", "video"],
        ["code-block"],
        ["clean"],
        ["custom-bg"],
      ],
      handlers: {
        // size: function(value) {  // Remove Quill's default handler
        //     this.quill.format('size', value);
        // }
        "custom-bg": function () {
          showColorPicker();
        },
      },
    },
  },
});

const sizes = ["8px", "12px", "16px", "24px", "32px"];
const customSizePicker = createCustomSizePicker(quill, sizes);
const toolbar = document.querySelector(".ql-toolbar"); // Or however you select your toolbar
toolbar.insertBefore(customSizePicker, toolbar.childNodes[1]); // Adjust insertion point

quill.root.style.fontSize = "16px";

// Apply size change functionality (Ensure text format changes when size changes)
quill.on("text-change", function (delta, oldDelta, source) {
  if (source === "user") {
    // Keep track of the selected size in case we need it
    const selectedSize = quill.getFormat().size;
    console.log("Current font size: ", selectedSize); // This can be used for any custom logic
  }
});

// State
let currentTopicId = null;
let currentPageId = null;
let isContentModified = false; // Flag for autosave

function showColorPicker() {
  const input = document.createElement("input");
  input.type = "color";
  input.style.position = "absolute";
  input.style.left = "-9999px";
  document.body.appendChild(input);
  console.log("curent page id", currentPageId);
  input.addEventListener("input", () => {
    const color = input.value;
    db.collection("pages")
      .doc(currentPageId)
      .update({
        backgroundColor: color,
      })
      .then(() => {
        quill.root.style.backgroundColor = color;
        console.log("Background color updated for the page.");
      })
      .catch((error) => {
        console.error("Error updating background color: ", error);
        alert("Could not update background color.");
      });

    // Update the background color of the page list item
    db.collection("pages")
      .where("topicId", "==", currentTopicId)
      .get()
      .then((snapshot) => {
        snapshot.forEach((doc) => {
          if (doc.id === currentPageId) {
            const pageItem = document.querySelector(
              `#pageList li[data-page-id="${doc.id}"]`
            );
            if (pageItem) {
              pageItem.style.backgroundColor = color;
            }
          }
        });
      })
      .catch((error) => {
        console.error(
          "Error updating page list item background color: ",
          error
        );
      });
  });

  input.click(); // Trigger the color picker
  //   input.remove();
}

function createCustomSizePicker(quill, sizes) {
  const sizePicker = document.createElement("select");
  sizePicker.classList.add("ql-size"); // Keep Quill's class for basic styling

  sizes.forEach((size) => {
    const option = document.createElement("option");
    option.value = size;
    option.textContent = size; // Display the size as text
    sizePicker.appendChild(option);
  });

  sizePicker.addEventListener("change", function () {
    const selectedSize = this.value;
    quill.format("size", selectedSize);
  });

  return sizePicker;
}

function addTopic() {
  if (!auth.currentUser) {
    console.warn("addTopic called before user was authenticated!");
    alert("Please log in first!");
    return;
  }

  const topicName = prompt("Enter topic name:");
  if (topicName) {
    db.collection("topics")
      .add({
        name: topicName,
        userId: auth.currentUser.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(), // Add this
      })
      .then(() => {
        loadTopics();
      })
      .catch((error) => {
        console.error("Error adding topic: ", error);
        alert("Could not add topic.");
      });
  }
}

function loadTopics() {
  if (!auth.currentUser) {
    console.warn("loadTopics called before user was authenticated!");
    return;
  }

  db.collection("topics")
    .where("userId", "==", auth.currentUser.uid)
    .orderBy("createdAt") //  Add this
    .get()
    .then((snapshot) => {
      topicsDiv.innerHTML = "";
      snapshot.forEach((doc) => {
        const topic = doc.data();
        const topicDiv = document.createElement("div");
        topicDiv.textContent = topic.name;
        topicDiv.onclick = () => {
          loadPages(doc.id);
          highlightTopic(topicDiv);
        };
        topicsDiv.appendChild(topicDiv);
      });
    })
    .catch((error) => {
      console.error("Error loading topics: ", error);
      alert("Could not load topics.");
    });
}

function loadPages(topicId, searchQuery = "") {
  // Add searchQuery parameter
  currentTopicId = topicId;
  pageList.innerHTML = "";
  db.collection("pages")
    .where("topicId", "==", topicId)
    .orderBy("createdAt")
    .get()
    .then((snapshot) => {
      snapshot.forEach((doc) => {
        const page = doc.data();
        // Filter pages based on search query
        if (
          searchQuery === "" ||
          page.title.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          const pageItem = document.createElement("li");
          pageItem.textContent = page.title;
          pageItem.setAttribute("data-page-id", doc.id);
          if (page.backgroundColor) {
            pageItem.style.backgroundColor = page.backgroundColor;
          }
          pageItem.onclick = () => loadPage(doc.id);
          pageList.appendChild(pageItem);
        }
      });
    })
    .catch((error) => {
      console.error("Error loading pages: ", error);
      alert("Could not load pages.");
    });
  deleteTopicBtn.classList.remove("hidden");
  deletePageBtn.classList.remove("hidden");
}

function loadPage(pageId, callback) {
  currentPageId = pageId;
  db.collection("pages")
    .doc(pageId)
    .get()
    .then((doc) => {
      if (doc.exists) {
        const page = doc.data();
        pageTitle.value = page.title;
        // Set Quill's content, using 'html'
        quill.root.innerHTML = page.content;

        // Reset or apply the background color
        if (page.backgroundColor) {
          quill.root.style.backgroundColor = page.backgroundColor;
        } else {
          quill.root.style.backgroundColor = ""; // Reset to default if no color is set
        }

        hljs.highlightAll();
        deletePageBtn.classList.remove("hidden");
        isContentModified = false;
        updateSidebarSelection(pageId);
      } else {
        console.error("No such document!");
      }
    })
    .catch((error) => {
      console.error("Error getting document:", error);
    })
    .finally(() => {
      if (callback) {
        callback(); // Execute the callback if it exists
      }
    });
}

function updateSidebarSelection(pageId) {
  const pageItems = document.querySelectorAll("#pageList li");
  pageItems.forEach((item) => item.classList.remove("selected"));
  const selectedPage = document.querySelector(
    `#pageList li[data-page-id="${pageId}"]`
  );
  if (selectedPage) {
    selectedPage.classList.add("selected");
  }
}

function addPage() {
  if (currentTopicId) {
    const newPage = {
      title: "Untitled",
      content: "",
    };

    db.collection("pages")
      .add({
        title: newPage.title,
        content: newPage.content,
        topicId: currentTopicId,
        userId: auth.currentUser.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(), // Add this
      })
      .then((docRef) => {
        newPage.id = docRef.id;

        const newListItem = document.createElement("li");
        newListItem.textContent = newPage.title;
        newListItem.setAttribute("data-page-id", docRef.id);
        newListItem.onclick = () => loadPage(docRef.id);
        pageList.appendChild(newListItem);

        loadPage(docRef.id, () => {
          // This callback runs AFTER loadPage is done
          pageTitle.focus();
          pageTitle.select();
        });
      })
      .catch((error) => {
        console.error("Error adding page: ", error);
        alert("Could not add page.");
      });
  }
}

// Update the page title and save to Firestore
pageTitle.addEventListener("input", () => {
  if (currentTopicId && currentPageId) {
    const newTitle = pageTitle.value.trim();
    if (newTitle) {
      db.collection("pages")
        .doc(currentPageId)
        .update({
          title: newTitle,
        })
        .then(() => {
          updateSidebarPageTitle(currentPageId, newTitle);
        })
        .catch((error) => {
          console.error("Error updating page title: ", error);
          alert("Could not update page title.");
        });
    }
  }
});

// Autosave functionality (using Quill's 'text-change' event)
quill.on("text-change", function () {
  if (currentTopicId && currentPageId) {
    isContentModified = true;
    debounceSaveContent();
  }
});

const debounceSaveContent = debounce(() => {
  if (isContentModified && currentTopicId && currentPageId) {
    const newContent = quill.root.innerHTML;

    db.collection("pages")
      .doc(currentPageId)
      .update({
        content: newContent,
      })
      .catch((error) => {
        // Only show alert if the page wasn't just deleted
        if (currentPageId) {
          console.error("Error updating page content: ", error);
          alert("Could not save page content.");
        }
      });

    isContentModified = false;
  }
}, 500);

// Update the page title in the sidebar
function updateSidebarPageTitle(pageId, newTitle) {
  const sidebarItems = pageList.getElementsByTagName("li");
  for (let item of sidebarItems) {
    if (item.getAttribute("data-page-id") === pageId) {
      item.textContent = newTitle;
      break;
    }
  }
}

// Delete Topic
function deleteCurrentTopic() {
  if (confirm("Are you sure you want to delete this topic?")) {
    db.collection("topics")
      .doc(currentTopicId)
      .delete()
      .then(() => {
        loadTopics();
        pageList.innerHTML = "";
        pageTitle.value = "";
        // quill.root.innerHTML = '';  // Clear Quill editor
        quill.root.innerHTML = "";
      })
      .catch((error) => {
        console.error("Error deleting topic: ", error);
        alert("Could not delete topic.");
      });
  }
}

function deleteCurrentPage() {
  if (confirm("Are you sure you want to delete this page?")) {
    // 👉 Temporarily disable autosave
    const oldPageId = currentPageId;
    currentPageId = null;
    isContentModified = false;

    db.collection("pages")
      .doc(oldPageId)
      .delete()
      .then(() => {
        loadPages(currentTopicId);
        pageTitle.value = "";
        quill.root.innerHTML = "";
      })
      .catch((error) => {
        console.error("Error deleting page: ", error);
        alert("Could not delete page.");
      });
  }
}

// Highlight the selected topic
function highlightTopic(topicDiv) {
  const topicDivs = document.querySelectorAll("#topics div");
  topicDivs.forEach((div) => div.classList.remove("selected"));
  topicDiv.classList.add("selected");
}

// Debounce function (utility)
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    const context = this;
    const later = function () {
      timeout = null;
      func.apply(context, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

pageSearch.addEventListener("input", () => {
  loadPages(currentTopicId, pageSearch.value);
});
