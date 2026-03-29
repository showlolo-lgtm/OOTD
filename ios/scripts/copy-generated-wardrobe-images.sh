#!/bin/sh

set -eu

ROOT_DIR="${SRCROOT}/.."
WARDROBE_JSON="${ROOT_DIR}/data/generated/wardrobe.generated.json"
SOURCE_DIR="${ROOT_DIR}/data/generated/images"
DEST_DIR="${TARGET_BUILD_DIR}/${UNLOCALIZED_RESOURCES_FOLDER_PATH}/GeneratedWardrobeImages"

rm -rf "${DEST_DIR}"
mkdir -p "${DEST_DIR}"

if [ ! -f "${WARDROBE_JSON}" ] || [ ! -d "${SOURCE_DIR}" ]; then
  echo "Skipping wardrobe image sync: generated wardrobe data not found."
  exit 0
fi

grep -o 'generated-assets/[^"]*' "${WARDROBE_JSON}" | sed 's#generated-assets/##' | sort -u | while IFS= read -r image_name; do
  [ -n "${image_name}" ] || continue

  if [ -f "${SOURCE_DIR}/${image_name}" ]; then
    cp "${SOURCE_DIR}/${image_name}" "${DEST_DIR}/${image_name}"
  else
    echo "warning: missing wardrobe image ${image_name}"
  fi
done

count=$(find "${DEST_DIR}" -type f | wc -l | tr -d ' ')
echo "Bundled ${count} wardrobe images into app resources."
