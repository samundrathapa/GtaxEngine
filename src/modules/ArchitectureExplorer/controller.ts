import { ApiController } from "../../api/controller.ts";
import { architectureFileTree, ArchFolderItem } from "./model.ts";

export class ArchitectureExplorerController {
  static getFolderTree(): ArchFolderItem[] {
    return architectureFileTree;
  }

  static async fetchServerTopology() {
    return ApiController.getTopology();
  }

  static async fetchMigrations() {
    return ApiController.getMigrations();
  }
}
