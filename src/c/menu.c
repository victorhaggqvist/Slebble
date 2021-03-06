#include "menu.h"

int updates = 0;
int new_id = 0;
AppTimer *scroll_timer;
int text_scroll = -2;
uint prev_index = 0;

#ifdef PBL_SDK_3
StatusBarLayer *status_bar;
#endif

uint16_t menu_get_num_sections_callback(MenuLayer *menu_layer, void *data) {
    Menu* menu = data;
    if(menu->id == 0)
        return 2;
    else
        return 1;
}

uint16_t menu_get_num_rows_callback(MenuLayer *menu_layer, uint16_t section_index, void *data) {
    Menu *menu = data;
    if (menu->id == 0 && section_index == 0)
        return 1;
    else
        return menu->size;
}

int16_t menu_get_header_height_callback(MenuLayer *menu_layer, uint16_t section_index, void *data) {
    // This is a define provided in pebble.h that you may use for the default height
    return MENU_CELL_BASIC_HEADER_HEIGHT;
}

void menu_draw_header_callback(GContext* ctx, const Layer *cell_layer, uint16_t section_index, void *data) {
    Menu* menu = data;
    if(menu->id == 0 && section_index == 0)
        menu_cell_basic_header_draw(ctx, cell_layer, "Stations");
    else
        menu_cell_basic_header_draw(ctx, cell_layer, menu->title);
}

void menu_draw_row_callback(GContext* ctx, const Layer *cell_layer, MenuIndex *cell_index, void *data) {
    Menu* menu = data;
    MenuIndex selected_item = menu_layer_get_selected_index(menu->layer);
    if(menu->id == 0 && cell_index->section == 0)
        menu_cell_basic_draw(ctx, cell_layer, "Nearby Stations", "", NULL);
    else {
        if(selected_item.row == cell_index->row && text_scroll >= 0)
            menu_cell_basic_draw(ctx, cell_layer, menu->row[cell_index->row]->title+((uint)text_scroll*sizeof(char)), menu->row[cell_index->row]->subtitle, NULL);
        else
            menu_cell_basic_draw(ctx, cell_layer, menu->row[cell_index->row]->title, menu->row[cell_index->row]->subtitle, NULL);
    }
}

void selection_changed_callback(struct MenuLayer *menu_layer, MenuIndex new_index, MenuIndex old_index, void *data) {

    Menu* menu = data;
    if(new_index.row != prev_index) {
        prev_index = new_index.row;
        text_scroll = -2;
    }
    if(menu->id == 0 && new_index.section == 0)
        text_scroll = -2;

}

/**
* CRASHES HERE
*/
void text_scroll_handler(void *data) {
    Menu* menu = *((Menu**)data);
    MenuIndex selected_item = menu_layer_get_selected_index(menu->layer);

    if(menu->size > 0) {
        char current_char = *(menu->row[selected_item.row]->title+((uint)text_scroll*sizeof(char)));
        //Fixes åäö edge case
        if(current_char == 195)
            text_scroll++;
    }

    if(!(menu->id == 0 && selected_item.section == 0))
        text_scroll++;

    if(menu->size > 0 && text_scroll > ((int)strlen(menu->row[selected_item.row]->title)) - 17)
        text_scroll = -2;

    menu_layer_reload_data(menu->layer);
    scroll_timer = app_timer_register(500, &text_scroll_handler, data);

}

void menu_allocation(Menu *menu, int size) {
    if(menu->size == 0) {
        menu->title = malloc(sizeof(char)*32);
        menu->row = malloc(sizeof(Row*)*size);

        for(int i = 0; i < size; i++) {
          menu->row[i] = row_create();
        }
    }

    if(menu->size != size && menu->size != 0) {
        if(menu->size > size) {
            for(int i = size; i < menu->size; i++) {
              row_destroy(menu->row[i]);
            }
        }

        menu->row = realloc(menu->row, sizeof(Row*)*size);

        if(menu->size < size) {
            for(int i = menu->size; i < size; i++) {
              menu->row[i] = row_create();
            }
        }
    }

    menu->size = size;
}

void menu_free_rows(Menu *menu) {
    if(menu->size != 0) {
        for(int i = 0; i < menu->size; i++) {
            row_destroy(menu->row[i]);
        }
        free(menu->row);
        free(menu->title);
    }
}

bool load_persistent(Menu *menu) {
    if(menu->id == 0 && persist_exists(0) && persist_read_int(0) > 0) {
        int size = persist_read_int(0);

        menu_allocation(menu, size);

        for(int i = 1; persist_exists(i); i++) {
            persist_read_string(i, menu->row[i-1]->title, 32);
            snprintf(menu->title, 32, "%s", "Favorites");
            snprintf(menu->row[i-1]->subtitle, 32, "%s", "");
            menu->size = size;
        }

        return true;
    }
    return false;
}

void store_persistent(Menu *menu) {
    persist_write_int(0, menu->size);
    for(int i = 0; i < menu->size; i++)
        persist_write_string(i+1, menu->row[i]->title);
}

void window_load(Window *window) {
    updates = 0;

    Menu* menu = window_get_user_data(window);

    Layer *window_layer = window_get_root_layer(window);
    GRect bounds = layer_get_frame(window_layer);

#ifdef PBL_SDK_3
    GRect menu_bounds = GRect(
            bounds.origin.x,
            bounds.origin.y + STATUS_BAR_LAYER_HEIGHT,
            bounds.size.w,
            bounds.size.h - STATUS_BAR_LAYER_HEIGHT
    );
    menu->layer = menu_layer_create(menu_bounds);
    menu->load_layer = bitmap_layer_create(menu_bounds);
#else
    menu->layer = menu_layer_create(bounds);
    menu->load_layer = bitmap_layer_create(bounds);
#endif

    menu_layer_set_callbacks(menu->layer, menu, (MenuLayerCallbacks){
            .get_num_sections = menu_get_num_sections_callback,
            .get_num_rows = menu_get_num_rows_callback,
            .get_header_height = menu_get_header_height_callback,
            .draw_header = menu_draw_header_callback,
            .draw_row = menu_draw_row_callback,
            .select_click = menu->callbacks.select_click,
            .selection_changed = selection_changed_callback,
    });

    menu->load_image = gbitmap_create_with_resource(menu->load_image_resource_id);
    bitmap_layer_set_background_color(menu->load_layer, GColorBlack);
    bitmap_layer_set_bitmap(menu->load_layer, menu->load_image);

    layer_add_child(window_layer, menu_layer_get_layer(menu->layer));
    layer_add_child(window_layer, bitmap_layer_get_layer(menu->load_layer));

}

void window_unload(Window *window) {
    Menu* menu = window_get_user_data(window);
    if(menu->id == 0)
      menu_deinit_text_scroll();

    Menu *ret = menu->menu;

    if(ret != NULL)
        prev_index = menu_layer_get_selected_index(ret->layer).row;
    text_scroll = -2;

    menu->callbacks.remove_callback(ret);

    window_stack_remove(window, true);
    window_destroy(window);
    menu_layer_destroy(menu->layer);
    bitmap_layer_destroy(menu->load_layer);
    gbitmap_destroy(menu->load_image);

    menu_free_rows(menu);

#ifdef PBL_SDK_3
    if(ret == NULL)
        status_bar_layer_destroy(status_bar);
#endif

    free(menu);
}

void window_appear(Window *window) {
#ifdef PBL_SDK_3
    if(status_bar == NULL)
        status_bar = status_bar_layer_create();
    layer_add_child(window_get_root_layer(window), status_bar_layer_get_layer(status_bar));
#endif
}

void hide_load_image(Menu *menu, bool vibe) {
    if(!layer_get_hidden(bitmap_layer_get_layer(menu->load_layer))) {
        prev_index = 0;
        text_scroll = -2;
        menu_layer_reload_data(menu->layer);
        layer_set_hidden(bitmap_layer_get_layer(menu->load_layer), true);
        menu_layer_set_click_config_onto_window(menu->layer, menu->window);
        if(vibe)
            vibes_short_pulse();
    }
}

void menu_add_rows(void *menu_void, char *title, Queue *queue) {
    if(menu_void == NULL)
        return;

    Menu *menu = (Menu*)menu_void;
    if(0 < menu->size && strcmp(menu->title, title) != 0)
      return;

    menu_allocation(menu, queue_length(queue));

    for(int i = 0; !queue_empty(queue); i++) {
        Row *row = queue_pop(queue);
        memcpy(menu->title, title, 32);
        row_memcpy(menu->row[i], row);

        if(0 < strlen(row->title))
            memcpy(menu->row[i]->title, row->title, 32);
        else {
            if(row->data_int > 0) {
                snprintf(menu->row[i]->title, 32, "%dmin - %s", row->data_int, row->data_char);
            } else {
                snprintf(menu->row[i]->title, 32, "Nu - %s", row->data_char);
            }
        }
        row_destroy(row);
    }

    menu_layer_reload_data(menu->layer);
    hide_load_image(menu, true);
    if(menu->id == 0)
        store_persistent(menu);
}

void menu_init_text_scroll(Menu **menu) {
    scroll_timer = app_timer_register(500, &text_scroll_handler, menu);
}
void menu_deinit_text_scroll() {
    app_timer_cancel(scroll_timer);
}

Menu* menu_create(uint32_t load_image_resource_id, MenuCallbacks callbacks) {
    Menu* menu = malloc(sizeof(Menu));
    menu->window = window_create();
    menu->load_image_resource_id = load_image_resource_id;
    menu->callbacks = callbacks;
    menu->size = 0;
    menu->id = new_id++;
    menu->title = "";

    bool loaded_persistant = load_persistent(menu);

    window_set_user_data(menu->window, menu);

    window_set_window_handlers(menu->window, (WindowHandlers) {
            .load = window_load,
            .unload = window_unload,
            .appear = window_appear,
    });

    //window_set_background_color(menu->window, GColorClear);

    window_stack_push(menu->window, true);
    if(loaded_persistant)
        hide_load_image(menu, false);

    return menu;
}
