const change_selected_user = (selected_user) => {
  let current_filepath = $("#regpermpanel").attr("filepath") || "";
  $("#regpermpanel").attr({
    username: selected_user,
    filepath: current_filepath,
  });
};

const change_selected_file = (selected_filepath) => {
  // Remove selection from all files/folders
  $(".file, .folder > h3").removeClass("selected-file");

  // Add selection to the clicked element
  let file_elem = $(
    `#${selected_filepath.replace(/\//g, "\\/").replace(/\./g, "\\.")}_div`
  );
  if (file_elem.hasClass("folder")) {
    file_elem.find("h3").first().addClass("selected-file");
  } else {
    file_elem.addClass("selected-file");
  }

  // Update the regular permissions panel with the selected file
  // Always update filepath, and preserve username if it exists
  let current_username = $("#regpermpanel").attr("username");
  $("#regpermpanel").attr({
    username: current_username || "",
    filepath: selected_filepath,
  });
};

// ---- Define your dialogs  and panels here ----

let regular_permissions_panel = define_new_regular_permissions(
  "regpermpanel",
  (add_info_col = true)
);
let user_select_field = define_new_user_select_field(
  "userselfield",
  "Select a User",
  change_selected_user
);
let explanations_dialog = define_new_dialog("expdialog");

$("#sidepanel").append([regular_permissions_panel, user_select_field]);

// Initialize the regular permissions panel with "Select User Below"
$("#regpermpanel").attr({ username: "", filepath: "" });

// ---- Display file structure ----

// (recursively) makes and returns an html element (wrapped in a jquery object) for a given file object
function make_file_element(file_obj) {
  let file_hash = get_full_path(file_obj);

  if (file_obj.is_folder) {
    let folder_elem =
      $(`<div class='folder selectable-file' id="${file_hash}_div" filepath="${file_hash}">
            <h3 id="${file_hash}_header" class="folder-header">
                <span class="oi oi-folder" id="${file_hash}_icon"/> ${file_obj.filename} 
                <button class="ui-button ui-widget ui-corner-all permbutton" path="${file_hash}" id="${file_hash}_permbutton"> 
                    <span class="oi oi-lock-unlocked" id="${file_hash}_permicon"/> Change Permissions
                </button>
            </h3>
        </div>`);

    // append children, if any:
    if (file_hash in parent_to_children) {
      let container_elem = $("<div class='folder_contents'></div>");
      folder_elem.append(container_elem);
      for (child_file of parent_to_children[file_hash]) {
        let child_elem = make_file_element(child_file);
        container_elem.append(child_elem);
      }
    }
    return folder_elem;
  } else {
    return $(`<div class='file selectable-file'  id="${file_hash}_div" filepath="${file_hash}">
            <span class="oi oi-file" id="${file_hash}_icon"/> ${file_obj.filename}
            <button class="ui-button ui-widget ui-corner-all permbutton" path="${file_hash}" id="${file_hash}_permbutton"> 
                <span class="oi oi-lock-unlocked" id="${file_hash}_permicon"/> Permissions
            </button>
        </div>`);
  }
}

for (let root_file of root_files) {
  let file_elem = make_file_element(root_file);
  $("#filestructure").append(file_elem);
}

// make folder hierarchy into an accordion structure
$(".folder").accordion({
  collapsible: true,
  heightStyle: "content",
}); // TODO: start collapsed and check whether read permission exists before expanding?

$(".file").click(function (e) {
  if (!$(e.target).closest(".permbutton").length) {
    let filepath = $(this).attr("filepath");
    change_selected_file(filepath);

    emitter.dispatchEvent(
      new CustomEvent("userEvent", {
        detail: new ClickEntry(
          ActionEnum.CLICK,
          e.clientX + window.pageXOffset,
          e.clientY + window.pageYOffset,
          e.target.id,
          new Date().getTime()
        ),
      })
    );
  }
});

$(".folder-header").click(function (e) {
  if (!$(e.target).closest(".permbutton").length) {
    let filepath = $(this).closest(".folder").attr("filepath");
    change_selected_file(filepath);
  }
});

// -- Connect File Structure lock buttons to the permission dialog --

// open permissions dialog when a permission button is clicked
$(".permbutton").click(function (e) {
  // Set the path and open dialog:
  let path = e.currentTarget.getAttribute("path");
  perm_dialog.attr("filepath", path);
  perm_dialog.dialog("open");
  //open_permissions_dialog(path)

  // Deal with the fact that folders try to collapse/expand when you click on their permissions button:
  e.stopPropagation(); // don't propagate button click to element underneath it (e.g. folder accordion)
  // Emit a click for logging purposes:
  emitter.dispatchEvent(
    new CustomEvent("userEvent", {
      detail: new ClickEntry(
        ActionEnum.CLICK,
        e.clientX + window.pageXOffset,
        e.clientY + window.pageYOffset,
        e.target.id,
        new Date().getTime()
      ),
    })
  );
});

// ---- Assign unique ids to everything that doesn't have an ID ----
$("#html-loc").find("*").uniqueId();
