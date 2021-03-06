#include "pebble.h"
#include "menu.h"
#include "event.h"

Menu *menu;
bool first_tick = false;

void tick_handler(struct tm *tick_time, TimeUnits units_changed) {
    if(first_tick) {

        for(int i = 0; i < menu->size; i++) {
            if(menu->row[i]->data_int > 0)
                menu->row[i]->data_int--;
        }

        for(int i = 0; i < menu->size; i++) {
            if(menu->row[i]->data_int > 0) {
              snprintf(menu->row[i]->title, 32, "%dmin - %s", menu->row[i]->data_int, menu->row[i]->data_char);
            } else {
              snprintf(menu->row[i]->title, 32, "Nu - %s", menu->row[i]->data_char);
            }
        }
        menu_layer_reload_data(menu->layer);

        update_appmessage();

    }
    first_tick = true;
}


void remove_callback_handler(void *data) {
    Menu* temp = data;
    menu = temp;
    tick_timer_service_unsubscribe();
}

void select_nearby_callback(MenuLayer *menu_layer, MenuIndex *cell_index, void *data) {
    char *click_data = menu->row[cell_index->row]->title;
    int row_clicked = cell_index->row;

    event_set_click_data(click_data);

    Menu *temp = menu;
    menu = menu_create(RESOURCE_ID_SLEBBLE_LOADING_BLACK, (MenuCallbacks) {
            .select_click = NULL,
            .remove_callback = &remove_callback_handler,
    });

    menu->menu = temp;

    if (app_comm_get_sniff_interval() == SNIFF_INTERVAL_NORMAL)
        app_comm_set_sniff_interval(SNIFF_INTERVAL_REDUCED);
    send_appmessage(row_clicked, 1);

    first_tick = false;
    tick_timer_service_subscribe(MINUTE_UNIT, tick_handler);
}

void select_callback(MenuLayer *menu_layer, MenuIndex *cell_index, void *data) {
    char *click_data;
    int row_clicked = cell_index->row + 1;

    if (cell_index->section == 0) {
        click_data = "Nearby Stations";
        row_clicked--;
    } else
        click_data = menu->row[cell_index->row]->title;

    if(strcmp(click_data, "No configuration") == 0)
      return;

    event_set_click_data(click_data);

    Menu *temp = menu;
    if(cell_index->section == 0) {
        menu = menu_create(RESOURCE_ID_SLEBBLE_LOADING_BLACK, (MenuCallbacks) {
                .select_click = &select_nearby_callback,
                .remove_callback = &remove_callback_handler,
        });
    } else {
        menu = menu_create(RESOURCE_ID_SLEBBLE_LOADING_BLACK, (MenuCallbacks) {
                .select_click = NULL,
                .remove_callback = &remove_callback_handler,
        });
    }

    menu->menu = temp;

    if (app_comm_get_sniff_interval() == SNIFF_INTERVAL_NORMAL)
        app_comm_set_sniff_interval(SNIFF_INTERVAL_REDUCED);
    send_appmessage(row_clicked, 0);

    if(cell_index->section != 0) {
        first_tick = false;
        tick_timer_service_subscribe(MINUTE_UNIT, tick_handler);
    }
}

int main(void) {

    menu = menu_create(RESOURCE_ID_SLEBBLE_START_BLACK, (MenuCallbacks){
            .select_click = &select_callback,
            .remove_callback = &remove_callback_handler,
    });

    event_set_view_func(&menu, &menu_add_rows);
    menu_init_text_scroll(&menu);
    event_register_app_message();

    app_event_loop();

    app_message_deregister_callbacks();
}
